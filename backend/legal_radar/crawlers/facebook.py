"""Facebook crawler — search phrase, extract post + 50 comments, 3min apart."""
from __future__ import annotations

import json
import logging
import random
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

SEARCH_PHRASE = u"\u0110\u01b0a th\u00f4ng tin sai s\u1ef1 th\u1eadt sau Ngh\u1ecb \u0111\u1ecbnh 174"

_UI_SKIP = {
    "xem th\u00eam", "th\u00edch", "tr\u1ea3 l\u1eddi", "chia s\u1ebb", "like", "reply", "share",
    "view", "find friends", "this photo", "view post", "meta ai", "friends",
    "memories", "saved", "groups", "reels", "marketplace", "events", "feeds",
    "notifications", "menu", "home", "search", "create", "privacy", "terms",
    "advertising", "ad choices", "cookies", "more", "see more", "join",
    "follow", "send message", "facebook", "meta", "ads manager",
    "see translation", "see original", "b\u00ecnh lu\u1eadn", "comment", "comments",
    "t\u1ea5t c\u1ea3 b\u00ecnh lu\u1eadn", "all comments", "ph\u00f9 h\u1ee3p nh\u1ea5t", "most relevant",
    "m\u1edbi nh\u1ea5t", "newest", "t\u1ea5t c\u1ea3", "all", "b\u00e0i vi\u1ebft", "post",
}


def _sleep(lo=1.0, hi=2.0):
    time.sleep(random.uniform(lo, hi))


def _parse_count(text: str) -> int:
    text = text.strip().replace(",", "")
    for sfx, mul in {"k": 1000, "m": 1000000, "b": 1000000000}.items():
        if text.lower().endswith(sfx):
            try:
                return int(float(text[:-1]) * mul)
            except ValueError:
                return 0
    try:
        return int(text)
    except ValueError:
        return 0


def _login(page, username: str, password: str) -> bool:
    logger.info(u"\u0110ang \u0111\u0103ng nh\u1eadp Facebook...")
    page.goto("https://www.facebook.com/login", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    el = page.query_selector('input[name="email"]')
    if el:
        el.click(); _sleep(0.3); el.fill(username); _sleep(0.3)
    el = page.query_selector('input[name="pass"]')
    if el:
        el.click(); _sleep(0.3); el.fill(password); _sleep(0.3)
    for btn in page.query_selector_all('div[role="button"]'):
        t = btn.inner_text().strip().lower()
        if u"\u0111\u0103ng nh\u1eadp" in t or "log in" in t:
            btn.click()
            break
    time.sleep(8)
    try:
        page.wait_for_load_state("networkidle", timeout=10000)
    except Exception:
        pass
    body = page.inner_text("body")[:500].lower()
    if any(x in body for x in ["what's on your mind", u"b\u1ea1n \u0111ang ngh\u00ec g\u00ec", "news feed", "feed posts"]):
        logger.info(u"\u0110\u0103ng nh\u1eadp OK")
        return True
    logger.error(u"\u0110\u0103ng nh\u1eadp th\u1ea5t b\u1ea1i")
    return False


def _collect_post_urls(page, needed: int) -> list[str]:
    """Search for posts. Try full phrase first, then shorter fallbacks."""
    urls = []
    seen = set()
    queries = [
        SEARCH_PHRASE,
        u"\u0110\u01b0a th\u00f4ng tin sai s\u1ef1 th\u1eadt Ngh\u1ecb \u0111\u1ecbnh 174",
        u"Ngh\u1ecb \u0111\u1ecbnh 174 tin gi\u1ea3",
        u"tin gi\u1ea3 MXH",
        u"fake news Vi\u1ec7t Nam",
    ]
    for query in queries:
        if len(urls) >= needed:
            break
        search_url = f"https://www.facebook.com/search/posts/?q={quote_plus(query)}"
        logger.info(u"T\u00ecm ki\u1ebfm: %s", query)
        page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        for i in range(5):
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
                if m:
                    post_url = f"https://www.facebook.com/{m.group(1)}"
            if not post_url:
                continue
            dedup = re.sub(r"[?&].*", "", post_url)
            if dedup in seen:
                continue
            seen.add(dedup)
            urls.append(post_url)
            if len(urls) >= needed:
                break
    logger.info(u"T\u1ed5ng: %d b\u00e0i", len(urls))
    return urls


def _select_all_comments(page) -> None:
    for btn in page.query_selector_all('div[role="button"], span[role="button"]'):
        try:
            t = btn.inner_text().strip().lower()
            if any(x in t for x in [u"ph\u00f9 h\u1ee3p", "relevant", u"m\u1edbi nh\u1ea5t", "newest"]):
                btn.click()
                _sleep(1.0, 1.5)
                for item in page.query_selector_all('div[role="menuitem"], div[role="option"], span'):
                    try:
                        it = item.inner_text().strip().lower()
                        if u"t\u1ea5t c\u1ea3" in it or "all comments" in it or it == "all":
                            item.click()
                            logger.info(u"  \u2192 T\u1ea5t c\u1ea3 b\u00ecnh lu\u1eadn")
                            _sleep(1.5, 2.0)
                            return
                    except Exception:
                        continue
                return
        except Exception:
            continue


def _expand_comments(page, max_clicks=60) -> int:
    count = 0
    for _ in range(max_clicks):
        clicked = False
        for text in [u"Xem th\u00eam b\u00ecnh lu\u1eadn", u"Xem th\u00eam", "View more comments", "View more", "Load more"]:
            try:
                els = page.get_by_text(text, exact=False)
                for i in range(els.count()):
                    el = els.nth(i)
                    if el.is_visible():
                        el.scroll_into_view_if_needed()
                        _sleep(0.3, 0.6)
                        el.click()
                        count += 1
                        clicked = True
                        _sleep(1.5, 2.5)
                        break
                if clicked:
                    break
            except Exception:
                continue
        if not clicked:
            for sel in ['[aria-label*="View more"]', u'[aria-label*="Xem th\u00eam"]']:
                try:
                    el = page.query_selector(sel)
                    if el and el.is_visible():
                        el.scroll_into_view_if_needed()
                        el.click()
                        count += 1
                        clicked = True
                        _sleep(1.5, 2.5)
                        break
                except Exception:
                    continue
        if not clicked:
            break
    logger.info(u"  \u2192 Click 'Xem th\u00eam' %d l\u1ea7n", count)
    return count


def _extract_post(page) -> dict:
    text = ""
    for sel in ['[data-ad-rendering-role="story_message"]', '[data-testid="post_message"]', 'div[data-ad-preview="message"]']:
        try:
            el = page.query_selector(sel)
            if el:
                text = el.inner_text().strip()
            if text:
                break
        except Exception:
            continue
    if not text:
        try:
            for b in page.query_selector_all('div[dir="auto"]'):
                t = b.inner_text().strip()
                if 30 < len(t) < 5000:
                    text = t
                    break
        except Exception:
            pass
    author = "Unknown"
    for sel in ['h2 a', 'h3 a', 'h4 a', 'strong > a[role="link"]']:
        try:
            el = page.query_selector(sel)
            if el:
                a = el.inner_text().strip()
                if a and len(a) < 100:
                    author = a
                    break
        except Exception:
            continue
    engagement = {"likes": 0, "shares": 0, "comments": 0}
    for el in page.query_selector_all("[aria-label]"):
        try:
            label = (el.get_attribute("aria-label") or "").lower()
            count = _parse_count(el.inner_text().strip())
            if count == 0:
                continue
            if "reaction" in label or "like" in label or u"th\u00edch" in label:
                engagement["likes"] = count
            elif "comment" in label or u"b\u00ecnh lu\u1eadn" in label:
                engagement["comments"] = count
            elif "share" in label or u"chia s\u1ebb" in label:
                engagement["shares"] = count
        except Exception:
            continue
    return {"text": text, "author": author, "engagement": engagement}


def _extract_comments(page, limit=50) -> list[dict]:
    comments = []
    seen = set()
    for art in page.query_selector_all('div[role="article"]'):
        if len(comments) >= limit:
            break
        try:
            aria = (art.get_attribute("aria-label") or "").lower()
            if u"b\u00ecnh lu\u1eadn" not in aria and "comment" not in aria:
                continue
            author = "Unknown"
            for a_sel in ['a[role="link"] > span > span', 'h4 a[role="link"]', 'a[role="link"]']:
                al = art.query_selector(a_sel)
                if al:
                    at = al.inner_text().strip()
                    if at and len(at) < 100 and at.lower() not in _UI_SKIP:
                        author = at
                        break
            text = ""
            for el in art.query_selector_all('div[dir="auto"]'):
                t = el.inner_text().strip()
                if len(t) > len(text) and t != author and 2 < len(t) < 3000:
                    text = t
            if not text:
                continue
            key = text[:80]
            if key in seen:
                continue
            seen.add(key)
            likes = 0
            ls = art.query_selector('[aria-label*="like"], [aria-label*="th\u00edch"]')
            if ls:
                likes = _parse_count(ls.inner_text().strip())
            comments.append({
                "text": text, "author": author,
                "timestamp": datetime.now(timezone.utc).isoformat(), "likes": likes,
            })
        except Exception:
            continue
    if len(comments) < 5:
        for el in page.query_selector_all('span[dir="auto"]'):
            if len(comments) >= limit:
                break
            try:
                t = el.inner_text().strip()
                if len(t) < 10 or len(t) > 2000:
                    continue
                if t.lower() in _UI_SKIP or any(t.lower().startswith(x) for x in _UI_SKIP):
                    continue
                if re.match(r"^[\W\s]+$", t):
                    continue
                key = t[:80]
                if key in seen:
                    continue
                seen.add(key)
                comments.append({
                    "text": t, "author": "Unknown",
                    "timestamp": datetime.now(timezone.utc).isoformat(), "likes": 0,
                })
            except Exception:
                continue
    return comments[:limit]


def crawl_post(page, url: str, max_comments=50) -> dict | None:
    try:
        logger.info(u"M\u1edf b\u00e0i: %s", url[:80])
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        if "login" in page.url.lower():
            logger.warning(u"Kh\u00f4ng truy c\u1eadp \u0111\u01b0\u1ee3c")
            return None
        content = _extract_post(page)
        if not content["text"] or len(content["text"]) < 20:
            logger.info(u"  B\u1ecf qua: kh\u00f4ng c\u00f3 text")
            return None
        logger.info(u"  T\u00e1c gi\u1ea3: %s", content["author"])
        logger.info(u"  Text: %s...", content["text"][:100])
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
        _select_all_comments(page)
        _expand_comments(page, max_clicks=60)
        for _ in range(3):
            page.evaluate("window.scrollBy(0, 800)")
            _sleep(0.5, 1.0)
        comments = _extract_comments(page, limit=max_comments)
        logger.info(u"  %d comments", len(comments))
        return {
            "platform": "facebook", "content_type": "post",
            "text": content["text"], "author": content["author"],
            "url": url, "timestamp": datetime.now(timezone.utc).isoformat(),
            "engagement": content["engagement"], "comments": comments,
        }
    except Exception as exc:
        logger.error(u"L\u1ed7i: %s", exc)
        return None


def crawl_facebook(
    keywords=None, max_posts=20, max_comments_per_post=50,
    delay_between_posts=180, fb_username="", fb_password="",
    output_path="runs/crawled_raw.jsonl",
) -> list[dict]:
    if not fb_username or not fb_password:
        logger.error(u"C\u1ea7n FB_USERNAME + FB_PASSWORD")
        return []
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("C\u1ea7n: pip install playwright")
        return []
    try:
        from playwright_stealth import Stealth
        stealth = Stealth()
    except ImportError:
        stealth = None
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            viewport={"width": 1366, "height": 768}, locale="vi-VN",
        )
        page = ctx.new_page()
        if stealth:
            try:
                stealth.apply_stealth_sync(page)
            except Exception:
                pass
        if not _login(page, fb_username, fb_password):
            browser.close()
            return []
        urls = _collect_post_urls(page, max_posts * 2)
        if not urls:
            logger.error(u"Kh\u00f4ng t\u00ecm th\u1ea5y b\u00e0i")
            browser.close()
            return []
        crawled = 0
        for i, url in enumerate(urls):
            if crawled >= max_posts:
                break
            logger.info(u"\n=== %d/%d ===", crawled + 1, max_posts)
            result = crawl_post(page, url, max_comments=max_comments_per_post)
            if result:
                results.append(result)
                with open(out, "a", encoding="utf-8") as f:
                    f.write(json.dumps(result, ensure_ascii=False) + "\n")
                crawled += 1
                logger.info(u"\u2713 %d: %s \u2014 %d comments", crawled, result["author"], len(result["comments"]))
            if crawled < max_posts and i < len(urls) - 1:
                logger.info(u"Ch\u1edd %ds...", delay_between_posts)
                time.sleep(delay_between_posts)
        browser.close()
    logger.info(u"\nDone! %d posts \u2192 %s", len(results), out)
    return results
