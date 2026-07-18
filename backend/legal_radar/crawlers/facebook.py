"""Facebook crawler — Playwright search + Bright Data API (fast, parallel).

Optimized:
    - No delay
    - Each URL scraped in parallel via threads
    - Posts + comments for same URL sent together
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

import requests

logger = logging.getLogger(__name__)

BRIGHTDATA_API_KEY = os.environ.get("BRIGHTDATA_API_KEY", "")
BD_BASE_URL = "https://api.brightdata.com/datasets/v3"
BD_POSTS_DATASET = "gd_lyclm1571iy3mv57zw"
BD_COMMENTS_DATASET = "gd_lkay758p1eanlolqw8"

FALLBACK_QUERIES = [
    "ngh\u1ecb \u0111\u1ecbnh 174 tin gi\u1ea3",
    "tin gi\u1ea3 MXH",
    "fake news",
    "ph\u1ea1t MXH",
    "b\u00f3c ph\u1ed1t",
    "tin \u0111\u0129n",
    "x\u1eed ph\u1ea1t m\u1ea1ng x\u00e3 h\u1ed9i",
]


def _bd_headers():
    return {"Authorization": f"Bearer {BRIGHTDATA_API_KEY}", "Content-Type": "application/json"}


def _bd_scrape(dataset_id: str, url: str) -> list[dict]:
    """Scrape single URL via Bright Data. Returns list of results."""
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
        for _ in range(90):
            time.sleep(3)
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
    """Crawl single post: content + comments via Bright Data."""
    posts = _bd_scrape(BD_POSTS_DATASET, url)
    if not posts:
        return None
    post = posts[0]
    if not post.get("content") or len(post.get("content", "")) < 20:
        return None

    comments = _bd_scrape(BD_COMMENTS_DATASET, url)

    post_url = post.get("url", "")
    post_id = post.get("post_id", "")
    post_comments = [
        c for c in comments
        if c.get("post_id") == post_id or c.get("post_url") == post_url
    ]
    formatted_comments = [
        {"text": c.get("comment_text", ""), "author": c.get("user_name", "Unknown"),
         "timestamp": c.get("date_created", ""), "likes": c.get("num_likes", 0)}
        for c in post_comments
    ]
    likes_data = post.get("num_likes_type", [])
    total_likes = sum(item.get("num", 0) for item in likes_data) if likes_data else post.get("likes", 0)

    return {
        "platform": "facebook", "content_type": "post",
        "text": post.get("content", ""),
        "author": post.get("user_username_raw", "Unknown"),
        "url": post_url,
        "timestamp": post.get("date_posted", ""),
        "engagement": {"likes": total_likes, "shares": post.get("num_shares", 0), "comments": post.get("num_comments", 0)},
        "comments": formatted_comments[:50],
    }


# ── Playwright: Login + Search ──

def _pw_login(page, username: str, password: str) -> bool:
    logger.info("Login Facebook...")
    page.goto("https://www.facebook.com/login", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    el = page.query_selector('input[name="email"]')
    if el: el.click(); time.sleep(0.3); el.fill(username); time.sleep(0.3)
    el = page.query_selector('input[name="pass"]')
    if el: el.click(); time.sleep(0.3); el.fill(password); time.sleep(0.3)
    for btn in page.query_selector_all('div[role="button"]'):
        t = btn.inner_text().strip().lower()
        if "log in" in t or "\u0111\u0103ng" in t:
            btn.click(); break
    time.sleep(8)
    try: page.wait_for_load_state("networkidle", timeout=10000)
    except: pass
    body = page.inner_text("body")[:500].lower()
    logged = any(x in body for x in ["what's on your mind", "news feed", "feed posts", "create a post", "find friends"])
    if not logged and "login" not in page.url.lower():
        logged = True
    if logged: logger.info("Login OK"); return True
    logger.error("Login failed"); return False


def _pw_collect_urls(page, needed: int) -> list[str]:
    urls, seen = [], set()
    for query in FALLBACK_QUERIES:
        if len(urls) >= needed: break
        logger.info("Search: %s", query)
        page.goto(f"https://www.facebook.com/search/posts/?q={quote_plus(query)}", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        for _ in range(3):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1)
        for link in page.query_selector_all('a[href*="facebook.com"]'):
            href = link.get_attribute("href") or ""
            if not href or any(x in href for x in ["/login", "/help", "/policies"]): continue
            post_url = None
            if "/posts/" in href or "/permalink/" in href or "/story_fbid=" in href:
                post_url = href.split("?")[0]
            elif "set=pcb." in href:
                m = re.search(r"set=pcb\.(\d+)", href)
                if m: post_url = f"https://www.facebook.com/{m.group(1)}"
            if not post_url: continue
            dedup = re.sub(r"[?&].*", "", post_url)
            if dedup in seen: continue
            seen.add(dedup)
            urls.append(post_url)
            if len(urls) >= needed: break
    logger.info("Found %d URLs", len(urls))
    return urls


# ── Main ──

def crawl_facebook(
    keywords=None, max_posts=20, max_comments_per_post=50,
    delay_between_posts=0, fb_username="", fb_password="",
    output_path="runs/crawled_raw.jsonl",
) -> list[dict]:
    if not BRIGHTDATA_API_KEY: logger.error("BRIGHTDATA_API_KEY required"); return []
    if not fb_username or not fb_password: logger.error("Credentials required"); return []

    try:
        from playwright.sync_api import sync_playwright
    except ImportError: logger.error("pip install playwright"); return []
    try:
        from playwright_stealth import Stealth; stealth = Stealth()
    except: stealth = None

    out = Path(output_path); out.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36",
            viewport={"width": 1366, "height": 768}, locale="vi-VN",
        )
        page = ctx.new_page()
        if stealth:
            try: stealth.apply_stealth_sync(page)
            except: pass
        if not _pw_login(page, fb_username, fb_password):
            browser.close(); return []
        urls = _pw_collect_urls(page, max_posts * 2)
        browser.close()

    if not urls: logger.error("No URLs found"); return []

    # Parallel: crawl each post in a thread
    results = []
    logger.info("Crawling %d posts in parallel...", len(urls))
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(_crawl_one_post, u): u for u in urls[:max_posts * 2]}
        for future in as_completed(futures):
            if len(results) >= max_posts: break
            try:
                result = future.result()
                if result:
                    results.append(result)
                    with open(out, "a", encoding="utf-8") as f:
                        f.write(json.dumps(result, ensure_ascii=False) + "\n")
                    logger.info("[%d] %s - %d comments", len(results), result["author"], len(result["comments"]))
            except Exception as exc:
                logger.warning("Error: %s", exc)

    logger.info("Done! %d posts -> %s", len(results), out)
    return results
