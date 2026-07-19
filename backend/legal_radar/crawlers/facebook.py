"""Facebook crawler — Bright Data Discover API + Scraper API.

Architecture:
    1. Discover API  → search keywords → collect Facebook post URLs
    2. Scraper API   → scrape post content + comments per URL (parallel)
    3. No Playwright, no browser automation needed.
"""
from __future__ import annotations

import json
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

from backend.legal_radar.settings import get_settings

logger = logging.getLogger(__name__)

BD_BASE_URL = "https://api.brightdata.com/datasets/v3"
BD_DISCOVER_URL = "https://api.brightdata.com/discover"
BD_POSTS_DATASET = "gd_lyclm1571iy3mv57zw"
BD_COMMENTS_DATASET = "gd_lkay758p1eanlolqw8"

FALLBACK_QUERIES = [
    "sáp nhập tỉnh",
    "đơn vị hành chính sáp nhập",
    "tin đồn sáp nhập tỉnh",
]


def _bd_headers() -> dict[str, str]:
    settings = get_settings()
    key = settings.brightdata_api_key or ""
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


# ── Discover API: keyword → URLs ──


def _discover_urls(queries: list[str], needed: int) -> list[dict]:
    """Use Bright Data Discover API to find Facebook URLs. Returns full result items."""
    items: list[dict] = []
    seen: set[str] = set()
    for query in queries:
        if len(items) >= needed:
            break
        logger.info("Discover: %s", query)
        try:
            resp = requests.post(
                BD_DISCOVER_URL,
                headers=_bd_headers(),
                json={
                    "query": f"{query} site:facebook.com",
                    "num_results": 5,
                    "format": "json",
                    "language": "vi",
                    "country": "VN",
                },
                timeout=15,
            )
        except requests.RequestException as exc:
            logger.warning("Discover POST failed for '%s': %s", query, exc)
            continue
        if resp.status_code != 200:
            logger.warning("Discover HTTP %s for '%s': %s", resp.status_code, query, resp.text[:200])
            continue
        task_id = resp.json().get("task_id")
        if not task_id:
            logger.warning("Discover returned no task_id for '%s': %s", query, resp.text[:200])
            continue
        results = _poll_discover(task_id)
        logger.info("Discover '%s' returned %d raw results", query, len(results))
        for item in results:
            link = item.get("link", "")
            if "facebook.com" not in link:
                logger.debug("Skip non-facebook: %s", link[:80])
                continue
            dedup = re.sub(r"[?&].*", "", link)
            if dedup in seen:
                continue
            seen.add(dedup)
            items.append(item)
            if len(items) >= needed:
                break
    logger.info("Discovered %d items from %d queries", len(items), len(queries))
    return items



def _poll_discover(task_id: str) -> list[dict]:
    """Poll Discover API until done. Returns list of result items."""
    for i in range(15):
        time.sleep(3)
        try:
            r = requests.get(
                f"{BD_DISCOVER_URL}?task_id={task_id}",
                headers=_bd_headers(),
                timeout=15,
            )
        except requests.RequestException:
            logger.warning("Discover poll %d failed for task %s", i, task_id)
            continue
        if r.status_code != 200:
            logger.warning("Discover poll %d HTTP %s for task %s", i, r.status_code, task_id)
            continue
        data = r.json()
        status = data.get("status", "unknown")
        if status == "done":
            logger.info("Discover task %s done after %d polls, got %d results", task_id, i + 1, len(data.get("results", [])))
            return data.get("results", [])
        logger.info("Discover poll %d: status=%s for task %s", i, status, task_id)
    logger.warning("Discover task %s timed out after 15 polls (45s)", task_id)
    return []


# ── Scraper API: URL → structured data ──


def _bd_scrape(dataset_id: str, url: str) -> list[dict]:
    """Scrape single URL via Bright Data dataset scraper. Returns list of results."""
    params = {"dataset_id": dataset_id, "include_errors": "true", "format": "json"}
    payload = {"input": [{"url": url}]}
    try:
        resp = requests.post(
            f"{BD_BASE_URL}/scrape", params=params,
            headers=_bd_headers(), json=payload, timeout=60,
        )
    except requests.Timeout:
        logger.warning("Scrape POST timeout for %s", url)
        return []
    except requests.RequestException as exc:
        logger.warning("Scrape POST error for %s: %s", url, exc)
        return []

    logger.info("Scrape %s got HTTP %s", url[:80], resp.status_code)

    if resp.status_code == 200:
        data = resp.json()
        if isinstance(data, list):
            return [d for d in data if "error" not in d]
        return []

    if resp.status_code == 202:
        data = resp.json()
        sid = data.get("snapshot_id")
        if not sid:
            return []
        for i in range(15):
            time.sleep(3)
            try:
                r = requests.get(f"{BD_BASE_URL}/snapshot/{sid}", headers=_bd_headers(), timeout=15)
            except requests.Timeout:
                logger.warning("Snapshot poll %d timeout for %s", i, sid)
                continue
            if r.status_code == 200:
                try:
                    result = r.json()
                    if isinstance(result, list):
                        return [d for d in result if "error" not in d]
                except Exception:
                    pass
            elif r.status_code != 202:
                break
    return []


def _crawl_one_post(url: str) -> dict | None:
    """Crawl single post: content + comments scraped in parallel."""
    t0 = time.time()
    posts: list[dict] = []
    comments: list[dict] = []
    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            post_future = pool.submit(_bd_scrape, BD_POSTS_DATASET, url)
            comments_future = pool.submit(_bd_scrape, BD_COMMENTS_DATASET, url)
            posts = post_future.result(timeout=70)
            comments = comments_future.result(timeout=70)
    except Exception as exc:
        logger.warning("Scraper timeout/error for %s: %s", url[:80], exc)
    elapsed = time.time() - t0
    logger.info("Scraped %s in %.1fs — %d posts, %d comments", url[:80], elapsed, len(posts), len(comments))

    if not posts:
        logger.debug("No post data for %s", url)
        return None
    post = posts[0]
    if not post.get("content") or len(post.get("content", "")) < 20:
        logger.debug("Short/empty content for %s", url)
        return None

    post_url = post.get("url", "")
    post_id = post.get("post_id", "")
    post_comments = [
        c for c in comments
        if c.get("post_id") == post_id
        or c.get("post_url", "").split("?")[0] == post_url.split("?")[0]
        or post_url in c.get("post_url", "")
    ]
    formatted_comments = [
        {
            "text": c.get("comment_text", ""),
            "author": c.get("user_name", "Unknown"),
            "author_id": c.get("user_id", ""),
            "author_url": c.get("user_url", ""),
            "timestamp": c.get("date_created", ""),
            "likes": c.get("num_likes", 0),
            "num_replies": c.get("num_replies", 0),
        }
        for c in post_comments
    ]
    likes_data = post.get("num_likes_type", [])
    total_likes = sum(item.get("num", 0) for item in likes_data) if likes_data else post.get("likes", 0)

    return {
        "platform": "facebook", "content_type": "post",
        "text": post.get("content", ""),
        "author": post.get("user_username_raw", "Unknown"),
        "author_id": post.get("profile_id", ""),
        "author_url": post.get("user_url", "") or post.get("page_url", ""),
        "author_handle": post.get("profile_handle", ""),
        "page_followers": post.get("page_followers"),
        "page_verified": post.get("page_is_verified", False),
        "url": post_url,
        "timestamp": post.get("date_posted", ""),
        "engagement": {"likes": total_likes, "shares": post.get("num_shares", 0), "comments": post.get("num_comments", 0)},
        "comments": formatted_comments[:50],
    }


# ── Main ──


def crawl_facebook(
    keywords: list[str] | None = None,
    max_posts: int = 20,
    output_path: str = "runs/crawled_raw.jsonl",
) -> list[dict]:
    """Crawl Facebook posts via Bright Data Discover + Scraper API.

    Flow: keywords → Discover API → scrape content + comments.
    Falls back to Discover metadata (title + description) if scraper fails.
    """
    t_start = time.time()
    settings = get_settings()
    if not settings.brightdata_api_key:
        logger.error("BRIGHTDATA_API_KEY required")
        return []

    queries = keywords or FALLBACK_QUERIES
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    discover_items = _discover_urls(queries, max_posts)
    if not discover_items:
        logger.error("No URLs found after %.1fs", time.time() - t_start)
        return []

    results: list[dict] = []
    failed = 0
    logger.info("Processing %d discovered items...", len(discover_items))

    for item in discover_items:
        if len(results) >= max_posts:
            break
        url = item.get("link", "")
        title = item.get("title", "")
        description = item.get("description", "")

        if "facebook.com" not in url.lower():
            logger.debug("Skip non-facebook URL: %s", url[:80])
            continue

        scraped = _crawl_one_post(url)
        if scraped:
            results.append(scraped)
            with open(out, "a", encoding="utf-8") as f:
                f.write(json.dumps(scraped, ensure_ascii=False) + "\n")
            logger.info("[%d/%d] scraped %s - %d comments", len(results), max_posts, scraped["author"], len(scraped["comments"]))
        else:
            fallback = {
                "platform": "facebook",
                "content_type": "post",
                "text": description or title,
                "author": title[:50] if title else "Unknown",
                "author_id": "",
                "author_url": url,
                "author_handle": "",
                "page_followers": None,
                "page_verified": False,
                "url": url,
                "timestamp": "",
                "engagement": {"likes": 0, "shares": 0, "comments": 0},
                "comments": [],
            }
            if fallback["text"] and len(fallback["text"]) >= 20:
                results.append(fallback)
                with open(out, "a", encoding="utf-8") as f:
                    f.write(json.dumps(fallback, ensure_ascii=False) + "\n")
                logger.info("[%d/%d] fallback from Discover metadata: %s", len(results), max_posts, title[:60])
            else:
                failed += 1
                logger.warning("Skipped %s — scraper failed and no Discover metadata", url[:80])

    logger.info("Done! %d/%d items, %d failed in %.1fs -> %s", len(results), max_posts, failed, time.time() - t_start, out)
    return results
