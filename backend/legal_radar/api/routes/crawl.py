"""On-demand social crawl endpoint with SSE streaming."""

from __future__ import annotations

import json
import logging
import os
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
    """Debug endpoint — test Bright Data APIs and return raw results."""
    import time
    import requests as http_requests
    from backend.legal_radar.settings import get_settings
    from backend.legal_radar.crawlers.facebook import BD_BASE_URL, BD_POSTS_DATASET, BD_COMMENTS_DATASET

    settings = get_settings()
    key = settings.brightdata_api_key or ""
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    result = {
        "api_key_set": bool(key),
        "api_key_prefix": key[:8] + "..." if len(key) > 8 else key,
    }

    if not key:
        result["error"] = "BRIGHTDATA_API_KEY is empty"
        return result

    # Test 1: Discover API
    query = "sáp nhập tỉnh site:facebook.com"
    try:
        resp = http_requests.post(
            "https://api.brightdata.com/discover",
            headers=headers,
            json={"query": query, "num_results": 3, "format": "json", "language": "vi", "country": "VN"},
            timeout=15,
        )
        result["discover_post_status"] = resp.status_code
        result["discover_post_response"] = resp.text[:500]
    except Exception as exc:
        result["discover_post_error"] = str(exc)
        return result

    if resp.status_code != 200:
        return result

    task_id = resp.json().get("task_id")
    if not task_id:
        result["error"] = "No task_id"
        return result
    result["discover_task_id"] = task_id

    discover_results = []
    for i in range(10):
        time.sleep(3)
        try:
            r = http_requests.get(f"https://api.brightdata.com/discover?task_id={task_id}", headers=headers, timeout=15)
            data = r.json()
            result[f"discover_poll_{i}"] = data.get("status")
            if data.get("status") == "done":
                discover_results = data.get("results", [])
                result["discover_results_count"] = len(discover_results)
                result["discover_results"] = discover_results[:2]
                break
        except Exception as exc:
            result[f"discover_poll_{i}_error"] = str(exc)

    if not discover_results:
        result["error"] = "Discover returned no results"
        return result

    # Test 2: Scraper API on first discovered URL
    test_url = discover_results[0].get("link", "")
    result["scraper_test_url"] = test_url

    for dataset_id, label in [(BD_POSTS_DATASET, "posts"), (BD_COMMENTS_DATASET, "comments")]:
        try:
            scrape_resp = http_requests.post(
                f"{BD_BASE_URL}/scrape",
                params={"dataset_id": dataset_id, "include_errors": "true", "format": "json"},
                headers=headers,
                json={"input": [{"url": test_url}]},
                timeout=30,
            )
            result[f"scraper_{label}_status"] = scrape_resp.status_code
            result[f"scraper_{label}_response"] = scrape_resp.text[:500]

            if scrape_resp.status_code == 202:
                sid = scrape_resp.json().get("snapshot_id")
                result[f"scraper_{label}_snapshot_id"] = sid
                if sid:
                    for j in range(10):
                        time.sleep(3)
                        sr = http_requests.get(f"{BD_BASE_URL}/snapshot/{sid}", headers=headers, timeout=15)
                        result[f"scraper_{label}_poll_{j}"] = sr.status_code
                        if sr.status_code == 200:
                            snap_data = sr.json()
                            result[f"scraper_{label}_result_count"] = len(snap_data) if isinstance(snap_data, list) else "not_list"
                            result[f"scraper_{label}_result"] = snap_data[:2] if isinstance(snap_data, list) else str(snap_data)[:500]
                            break
        except Exception as exc:
            result[f"scraper_{label}_error"] = str(exc)

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
    thread.join(timeout=600)
    if thread.is_alive():
        error = "Crawl timeout (600s)"
    return result, error


@router.post("/crawl")
def trigger_crawl(request: CrawlRequest):
    from backend.legal_radar.settings import get_settings
    settings = get_settings()
    youtube_enabled = os.environ.get("CRAWL_YOUTUBE_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
    news_enabled = os.environ.get("CRAWL_NEWS_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
    if not settings.brightdata_api_key and not youtube_enabled and not news_enabled:
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
