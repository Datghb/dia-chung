"""On-demand social crawl endpoint with SSE streaming."""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import asdict
from hashlib import sha1

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ...pipeline import _build_crawled_ingestor, _queue_path
from ..dependencies import data_dir, runs_dir
from ..schemas import CrawlRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["crawl"])


def _try_live_crawl(keywords, max_posts, output_path):
    """Try Bright Data crawl in a background thread with timeout."""
    from ...crawlers.scheduler import crawl_and_process
    result = {"items": [], "crawled": 0, "relevant": 0}
    def _run():
        try:
            result.update(crawl_and_process(
                keywords=keywords or None,
                max_posts=max_posts,
                output_path=output_path,
            ))
        except Exception as exc:
            logger.warning("Live crawl failed: %s", exc)
    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    thread.join(timeout=45)
    return result


def _load_sample_items():
    sample_path = data_dir() / "fixtures" / "crawled_sample.json"
    if sample_path.exists():
        return json.loads(sample_path.read_text(encoding="utf-8"))
    return []


@router.post("/crawl")
def trigger_crawl(request: CrawlRequest):
    output_path = runs_dir() / "crawled_raw.jsonl"

    live = _try_live_crawl(request.keywords, request.max_posts_per_platform, output_path)
    items = live["items"]
    mode = "live"

    if not items:
        items = _load_sample_items()[:request.max_posts_per_platform]
        mode = "fallback"

    message = (
        f"Đã thu thập {live['crawled']} nội dung, {live['relevant']} liên quan."
        if mode == "live"
        else f"Đã nạp {len(items)} nội dung dự phòng."
    )

    def stream():
        yield json.dumps({"type": "start", "message": message, "mode": mode, "total": len(items)}, ensure_ascii=False) + "\n"

        queue_path = _queue_path()
        ingestor = _build_crawled_ingestor(queue_path)
        queue_path.parent.mkdir(parents=True, exist_ok=True)
        count = 0

        with queue_path.open("a", encoding="utf-8") as queue_file:
            for post in items:
                url = str(post.get("url", ""))
                timestamp = str(post.get("timestamp", ""))
                post_platform = str(post.get("platform", "Facebook")).title()
                if post_platform == "Youtube":
                    post_platform = "YouTube"
                post_author = str(post.get("author", ""))
                engagement = post.get("engagement") or {}
                post_reach = sum(int(v or 0) for v in engagement.values() if isinstance(v, (int, float)))

                candidates = [
                    {
                        "id": sha1(url.encode("utf-8")).hexdigest(),
                        "text": str(post.get("text", "")),
                        "url": url,
                        "thoi_gian": timestamp,
                        "platform": post_platform,
                        "account": post_author,
                        "published_at": str(post.get("timestamp", "")),
                        "reach": post_reach,
                    }
                ]
                candidates.extend(
                    {
                        "id": sha1(f"{url}#c{index}".encode("utf-8")).hexdigest(),
                        "text": str(comment.get("text", "")),
                        "url": url,
                        "thoi_gian": str(comment.get("timestamp", timestamp)),
                        "platform": post_platform,
                        "account": str(comment.get("author", post_author)),
                        "published_at": str(comment.get("timestamp", timestamp)),
                        "reach": 0,
                    }
                    for index, comment in enumerate(post.get("comments") or [])
                )

                for candidate in candidates:
                    if not candidate.get("text", "").strip():
                        continue
                    try:
                        queue_item = ingestor.process_one(candidate, skip_source_search=False)
                        queue_file.write(json.dumps(asdict(queue_item), ensure_ascii=False) + "\n")
                        queue_file.flush()
                        count += 1
                        yield json.dumps({
                            "type": "item",
                            "count": count,
                            "id": queue_item.id,
                            "claim": queue_item.claim[:100],
                            "label": queue_item.nhan.value,
                            "subject": queue_item.subject,
                            "source_title": queue_item.source_title,
                            "source_url": queue_item.source_url,
                            "source_agency": queue_item.source_agency,
                        }, ensure_ascii=False) + "\n"
                    except Exception as exc:
                        logger.warning("Crawl item error: %s", exc)
                        continue

        yield json.dumps({"type": "done", "analyzed": count}, ensure_ascii=False) + "\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
