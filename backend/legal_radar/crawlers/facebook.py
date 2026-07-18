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
from concurrent.futures import ThreadPoolExecutor, as_completed
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
    "giảm đơn vị hành chính",
    "34 tỉnh còn 16",
    "sáp nhập đơn vị hành chính cấp tỉnh",
    "gộp tỉnh 2026",
    "giảm số lượng tỉnh",
    "Bộ Nội vụ sáp nhập",
    "tin đồn sáp nhập tỉnh",
    "sắp xếp đơn vị hành chính",
]


def _bd_headers() -> dict[str, str]:
    settings = get_settings()
    key = settings.brightdata_api_key or ""
    return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}


# ── Discover API: keyword → URLs ──


def _discover_urls(queries: list[str], needed: int) -> list[str]:
    """Use Bright Data Discover API to find Facebook post URLs by keyword."""
    urls: list[str] = []
    seen: set[str] = set()
    for query in queries:
        if len(urls) >= needed:
            break
        logger.info("Discover: %s", query)
        try:
            resp = requests.post(
                BD_DISCOVER_URL,
                headers=_bd_headers(),
                json={
                    "query": f"{query} site:facebook.com",
                    "num_results": 10,
                    "format": "json",
                    "language": "vi",
                    "country": "VN",
                },
                timeout=30,
            )
        except requests.RequestException:
            continue
        if resp.status_code != 200:
            continue
        task_id = resp.json().get("task_id")
        if not task_id:
            continue
        results = _poll_discover(task_id)
        for item in results:
            link = item.get("link", "")
            if "facebook.com" not in link:
                continue
            if not _is_post_url(link):
                continue
            dedup = re.sub(r"[?&].*", "", link)
            if dedup in seen:
                continue
            seen.add(dedup)
            urls.append(link)
            if len(urls) >= needed:
                break
    logger.info("Discovered %d post URLs", len(urls))
    return urls


def _is_post_url(url: str) -> bool:
    """Check if URL looks like a scrapable Facebook post."""
    return any(pat in url for pat in ["/posts/", "/permalink/", "/story_fbid=", "set=pcb."])


def _poll_discover(task_id: str) -> list[dict]:
    """Poll Discover API until done. Returns list of result items."""
    for _ in range(20):
        time.sleep(3)
        try:
            r = requests.get(
                f"{BD_DISCOVER_URL}?task_id={task_id}",
                headers=_bd_headers(),
                timeout=30,
            )
        except requests.RequestException:
            continue
        if r.status_code != 200:
            continue
        data = r.json()
        if data.get("status") == "done":
            return data.get("results", [])
    return []


# ── Scraper API: URL → structured data ──


def _bd_scrape(dataset_id: str, url: str) -> list[dict]:
    """Scrape single URL via Bright Data dataset scraper. Returns list of results."""
    params = {"dataset_id": dataset_id, "include_errors": "true", "format": "json"}
    payload = {"input": [{"url": url}]}
    try:
        resp = requests.post(
            f"{BD_BASE_URL}/scrape", params=params,
            headers=_bd_headers(), json=payload, timeout=120,
        )
    except requests.Timeout:
        return []

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
        for _ in range(40):
            time.sleep(2)
            try:
                r = requests.get(f"{BD_BASE_URL}/snapshot/{sid}", headers=_bd_headers(), timeout=30)
            except requests.Timeout:
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
    with ThreadPoolExecutor(max_workers=2) as pool:
        post_future = pool.submit(_bd_scrape, BD_POSTS_DATASET, url)
        comments_future = pool.submit(_bd_scrape, BD_COMMENTS_DATASET, url)
        posts = post_future.result()
        comments = comments_future.result()

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
        if c.get("post_id") == post_id or c.get("post_url") == post_url
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

    Flow: keywords → Discover API → post URLs → scrape content + comments.
    No Playwright or browser automation required.
    """
    settings = get_settings()
    if not settings.brightdata_api_key:
        logger.error("BRIGHTDATA_API_KEY required")
        return []

    queries = keywords or FALLBACK_QUERIES
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    urls = _discover_urls(queries, max_posts * 3)
    if not urls:
        logger.error("No URLs found")
        return []

    results: list[dict] = []
    failed = 0
    logger.info("Crawling %d posts in parallel...", len(urls))
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(_crawl_one_post, u): u for u in urls}
        for future in as_completed(futures):
            if len(results) >= max_posts:
                break
            try:
                result = future.result()
                if result:
                    results.append(result)
                    with open(out, "a", encoding="utf-8") as f:
                        f.write(json.dumps(result, ensure_ascii=False) + "\n")
                    logger.info("[%d/%d] %s - %d comments", len(results), max_posts, result["author"], len(result["comments"]))
                else:
                    failed += 1
            except Exception as exc:
                failed += 1
                logger.warning("Error: %s", exc)

    logger.info("Done! %d/%d posts scraped, %d failed -> %s", len(results), max_posts, failed, out)
    return results
