"""On-demand social crawl endpoint with SSE streaming."""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import asdict
from hashlib import sha1

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.legal_radar.pipeline import _build_crawled_ingestor, _queue_path
from backend.legal_radar.api.dependencies import runs_dir
from backend.legal_radar.api.schemas import CrawlRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["crawl"])


@router.get("/crawl/debug")
def debug_crawl():
    """Debug endpoint — test Bright Data Discover API and return raw result."""
    import time
    import requests as http_requests
    from backend.legal_radar.settings import get_settings

    settings = get_settings()
    key = settings.brightdata_api_key or ""
    result = {
        "api_key_set": bool(key),
        "api_key_prefix": key[:8] + "..." if len(key) > 8 else key,
    }

    if not key:
        result["error"] = "BRIGHTDATA_API_KEY is empty"
        return result

    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    query = "sáp nhập tỉnh site:facebook.com"

    try:
        resp = http_requests.post(
            "https://api.brightdata.com/discover",
            headers=headers,
            json={"query": query, "num_results": 3, "format": "json", "language": "vi", "country": "VN"},
            timeout=15,
        )
        result["post_status"] = resp.status_code
        result["post_response"] = resp.text[:500]
    except Exception as exc:
        result["post_error"] = str(exc)
        return result

    if resp.status_code != 200:
        return result

    task_id = resp.json().get("task_id")
    if not task_id:
        result["error"] = "No task_id in response"
        return result

    result["task_id"] = task_id

    for i in range(10):
        time.sleep(3)
        try:
            r = http_requests.get(
                f"https://api.brightdata.com/discover?task_id={task_id}",
                headers=headers,
                timeout=15,
            )
            data = r.json()
            result[f"poll_{i}_status"] = r.status_code
            result[f"poll_{i}_body_status"] = data.get("status")
            if data.get("status") == "done":
                results = data.get("results", [])
                result["done"] = True
                result["results_count"] = len(results)
                result["results"] = results[:3]
                return result
        except Exception as exc:
            result[f"poll_{i}_error"] = str(exc)

    result["error"] = "Timed out after 10 polls (30s)"
    return result


def _try_live_crawl(keywords, max_posts, output_path):
    """Try Bright Data crawl in a background thread with timeout."""
    from backend.legal_radar.crawlers.scheduler import crawl_and_process
    result = {"items": [], "crawled": 0, "relevant": 0}
    error = None
    def _run():
        nonlocal error
        try:
            result.update(crawl_and_process(
                keywords=keywords or None,
                max_posts=max_posts,
                output_path=output_path,
            ))
        except Exception as exc:
            error = str(exc)
            logger.warning("Live crawl failed: %s", exc)
    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    thread.join(timeout=240)
    if thread.is_alive():
        error = "Crawl timeout (240s)"
    return result, error


@router.post("/crawl")
def trigger_crawl(request: CrawlRequest):
    from backend.legal_radar.settings import get_settings
    settings = get_settings()
    if not settings.brightdata_api_key:
        def stream_no_key():
            yield json.dumps({
                "type": "error",
                "message": "BRIGHTDATA_API_KEY chưa được cấu hình. Không thể quét MXH.",
                "crawled": 0,
                "relevant": 0,
            }, ensure_ascii=False) + "\n"
        return StreamingResponse(stream_no_key(), media_type="text/event-stream")

    output_path = runs_dir() / "crawled_raw.jsonl"

    live, error = _try_live_crawl(request.keywords, request.max_posts_per_platform, output_path)
    items = live["items"]

    def stream():
        if not items:
            crawled = live["crawled"]
            relevant = live["relevant"]
            if error:
                reason = f"Lỗi: {error}"
            elif crawled == 0:
                reason = "Discover API không tìm thấy URL nào. Kiểm tra BRIGHTDATA_API_KEY."
            elif relevant == 0:
                reason = f"Discover tìm thấy {crawled} URL nhưng không có nội dung liên quan sáp nhập ĐVHC."
            else:
                reason = "Không tìm thấy nội dung liên quan trên mạng xã hội"
            yield json.dumps({
                "type": "error",
                "message": f"Quét MXH thất bại: {reason}",
                "crawled": crawled,
                "relevant": relevant,
            }, ensure_ascii=False) + "\n"
            return

        message = f"Đã thu thập {live['crawled']} nội dung, {live['relevant']} liên quan."

        yield json.dumps({"type": "start", "message": message, "mode": "live", "total": len(items)}, ensure_ascii=False) + "\n"

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

                raw_comments = post.get("comments") or []
                bundled_comments = [
                    {
                        "text": str(c.get("text", "")),
                        "author": str(c.get("author", "")),
                        "timestamp": str(c.get("timestamp", "")),
                    }
                    for c in raw_comments[:20]
                    if str(c.get("text", "")).strip()
                ]

                candidate = {
                    "id": sha1(url.encode("utf-8")).hexdigest(),
                    "text": str(post.get("text", "")),
                    "url": url,
                    "thoi_gian": timestamp,
                    "platform": post_platform,
                    "account": post_author,
                    "published_at": str(post.get("timestamp", "")),
                    "reach": post_reach,
                    "comments": bundled_comments,
                }

                if not candidate.get("text", "").strip():
                    continue
                try:
                    queue_item = ingestor.process_one(candidate, skip_source_search=True)
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
                        "comments_count": len(bundled_comments),
                    }, ensure_ascii=False) + "\n"
                except Exception as exc:
                    logger.warning("Crawl item error: %s", exc)
                    continue

        yield json.dumps({"type": "done", "analyzed": count}, ensure_ascii=False) + "\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
