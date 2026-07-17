"""Facebook crawler — Hybrid: Playwright search + Bright Data API extract.

Flow:
    1. Playwright: login → search → collect post URLs
    2. Bright Data Posts API: get structured content for each post
    3. Bright Data Comments API: get structured comments
    4. 20 posts, 3 min apart
"""
from __future__ import annotations

import json
import logging
import os
import random
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

import requests

logger = logging.getLogger(__name__)

BRIGHTDATA_API_KEY = os.environ.get("BRIGHTDATA_API_KEY", "")
BD_BASE_URL = "https://api.brightdata.com/datasets/v3"
BD_POSTS_DATASET = "gd_lyclm1571iy3mv57zw"
BD_COMMENTS_DATASET = "gd_lkay758p1eanlolqw8"

SEARCH_PHRASE = u"\u0110\u01b0a th\u00f4ng tin sai s\u1ef1 th\u1eadt sau Ngh\u1ecb \u0111\u1ecbnh 174"

FALLBACK_QUERIES = [
    SEARCH_PHRASE,
    u"\u0110\u01b0a th\u00f4ng tin sai s\u1ef1 th\u1eadt Ngh\u1ecb \u0111\u1ecbnh 174",
    u"Ngh\u1ecb \u0111\u1ecbnh 174 tin gi\u1ea3",
    u"tin gi\u1ea3 MXH",
    u"fake news Vi\u1ec7t Nam",
    u"ph\u1ea1t MXH",
    u"b\u00f3c ph\u1ed1t",
]


def _sleep(lo=1.0, hi=2.0):
    time.sleep(random.uniform(lo, hi))


def _bd_headers():
    return {"Authorization": f"Bearer {BRIGHTDATA_API_KEY}", "Content-Type": "application/json"}


def _bd_scrape(dataset_id: str, input_data: list[dict]) -> list[dict]:
    """Scrape via Bright Data API. Handles sync (200) and async (202)."""
    url = f"{BD_BASE_URL}/scrape"
    params = {"dataset_id": dataset_id, "include_errors": "true", "format": "json"}
    try:
        resp = requests.post(url, params=params, headers=_bd_headers(), json={"input": input_data}, timeout=90)
    except requests.Timeout:
        logger.warning("Bright Data timeout")
        return []

    if resp.status_code == 200:
        data = resp.json()
        if isinstance(data, list):
            # Filter out errors
            return [d for d in data if "error" not in d]
        return []

    if resp.status_code == 202:
        data = resp.json()
        sid = data.get("snapshot_id")
        if not sid:
            return []
        logger.info("  Async snapshot: %s, polling...", sid)
        for i in range(60):
            time.sleep(5)
            r = requests.get(f"{BD_BASE_URL}/snapshot/{sid}", headers=_bd_headers(), timeout=30)
            if r.status_code == 200:
                result = r.json()
                if isinstance(result, list):
                    return [d for d in result if "error" not in d]
                return []
            logger.debug("  Poll %d: %d", i + 1, r.status_code)
        logger.warning("Snapshot %s timeout", sid)
        return []

    logger.warning("Bright Data error: %d %s", resp.status_code, resp.text[:200])
    return []


# ── Playwright: Login + Search ──

def _pw_login(page, username: str, password: str) -> bool:
    logger.info(u"\u0110\u0103ng nh\u1eadp Facebook...")
    page.goto("https://www.facebook.com/login", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    el = page.query_selector('input[name="email"]')
    if el: el.click(); _sleep(0.3); el.fill(username); _sleep(0.3)
    el = page.query_selector('input[name="pass"]')
    if el: el.click(); _sleep(0.3); el.fill(password); _sleep(0.3)
    for btn in page.query_selector_all('div[role="button"]'):
        t = btn.inner_text().strip().lower()
        if u"\u0111\u0103ng nh\u1eadp" in t or "log in" in t:
            btn.click(); break
    time.sleep(8)
    try: page.wait_for_load_state("networkidle", timeout=10000)
    except: pass
    body = page.inner_text("body")[:500].lower()
    if any(x in body for x in ["what's on your mind", u"b\u1ea1n \u0111ang ngh\u00ec g\u00ec", "news feed", "feed posts"]):
        logger.info(u"\u0110\u0103ng nh\u1eadp OK"); return True
    logger.error(u"\u0110\u0103ng nh\u1eadp th\u1ea5t b\u1ea1i"); return False


def _pw_collect_urls(page, needed: int) -> list[str]:
    """Search Facebook via Playwright, collect post URLs."""
    urls = []
    seen = set()
    for query in FALLBACK_QUERIES:
        if len(urls) >= needed:
            break
        search_url = f"https://www.facebook.com/search/posts/?q={quote_plus(query)}"
        logger.info(u"T\u00ecm ki\u1ebfm: %s", query)
        page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        for _ in range(5):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            _sleep(2.0, 3.0)
        for link in page.query_selector_all('a[href*="facebook.com"]'):
            href = link.get_attribute("href") or ""
            if not href or any(x in href for x in ["/login", "/help", "/policies"]):
                continue
            post_url = None
            if "/posts/" in href or "/permalink/" in href or "/story_fbid=" in href:
                post_url = href.split("?")[0]
            elif "set=pcb." in href:
                m = re.search(r"set=pcb\.(\d+)", href)
                if m: post_url = f"https://www.facebook.com/{m.group(1)}"
            if not post_url:
                continue
            dedup = re.sub(r"[?&].*", "", post_url)
            if dedup in seen:
                continue
            seen.add(dedup)
            urls.append(post_url)
            if len(urls) >= needed:
                break
    logger.info(u"T\u1ed5ng: %d b\u00e0i URLs", len(urls))
    return urls


# ── Format ──

def _format_post(post: dict, comments: list[dict]) -> dict:
    post_url = post.get("url", "")
    post_id = post.get("post_id", "")
    post_comments = [
        c for c in comments
        if c.get("post_id") == post_id or c.get("post_url") == post_url
    ]
    formatted = []
    for c in post_comments:
        formatted.append({
            "text": c.get("comment_text", ""),
            "author": c.get("user_name", "Unknown"),
            "timestamp": c.get("date_created", ""),
            "likes": c.get("num_likes", 0),
        })
    likes_data = post.get("num_likes_type", [])
    total_likes = sum(item.get("num", 0) for item in likes_data) if likes_data else post.get("likes", 0)
    return {
        "platform": "facebook", "content_type": "post",
        "text": post.get("content", ""),
        "author": post.get("user_username_raw", "Unknown"),
        "url": post_url,
        "timestamp": post.get("date_posted", ""),
        "engagement": {"likes": total_likes, "shares": post.get("num_shares", 0), "comments": post.get("num_comments", 0)},
        "comments": formatted[:50],
    }


# ── Main ──

def crawl_facebook(
    keywords=None, max_posts=20, max_comments_per_post=50,
    delay_between_posts=180, fb_username="", fb_password="",
    output_path="runs/crawled_raw.jsonl",
) -> list[dict]:
    if not BRIGHTDATA_API_KEY:
        logger.error("BRIGHTDATA_API_KEY required"); return []
    if not fb_username or not fb_password:
        logger.error("FB_USERNAME + FB_PASSWORD required"); return []

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("pip install playwright"); return []
    try:
        from playwright_stealth import Stealth
        stealth = Stealth()
    except:
        stealth = None

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    results = []

    # Step 1: Playwright — login + collect URLs
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
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

    if not urls:
        logger.error(u"Kh\u00f4ng t\u00ecm th\u1ea5y b\u00e0i"); return []

    # Step 2: Bright Data — extract content + comments
    crawled = 0
    for i, url in enumerate(urls):
        if crawled >= max_posts:
            break

        logger.info(u"\n=== %d/%d ===", crawled + 1, max_posts)
        logger.info("URL: %s", url[:80])

        # Get post content
        posts = _bd_scrape(BD_POSTS_DATASET, [{"url": url}])
        if not posts:
            logger.info("  Kh\u00f4ng l\u1ea5y \u0111\u01b0\u1ee3c n\u1ed9i dung"); continue

        post = posts[0]
        if not post.get("content") or len(post.get("content", "")) < 20:
            logger.info("  B\u1ecf qua: n\u1ed9i dung ng\u1eafn"); continue

        # Get comments
        comments = _bd_scrape(BD_COMMENTS_DATASET, [{"url": url}])
        logger.info(u"  Comments API: %d k\u1ebft qu\u1ea3", len(comments))

        # Format + save
        result = _format_post(post, comments)
        results.append(result)
        with open(out, "a", encoding="utf-8") as f:
            f.write(json.dumps(result, ensure_ascii=False) + "\n")

        crawled += 1
        logger.info(u"\u2713 %d: %s \u2014 %d comments", crawled, result["author"], len(result["comments"]))

        if crawled < max_posts and i < len(urls) - 1:
            logger.info(u"Ch\u1edd %ds...", delay_between_posts)
            time.sleep(delay_between_posts)

    logger.info(u"\nDone! %d posts \u2192 %s", len(results), out)
    return results
