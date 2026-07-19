"""Vietnamese news crawler using publisher-provided RSS feeds."""
from __future__ import annotations

import html
import logging
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import timezone
from email.utils import parsedate_to_datetime
from typing import Any
from xml.etree import ElementTree

import requests

from .filter import is_relevant

logger = logging.getLogger(__name__)

DEFAULT_FEEDS: tuple[tuple[str, str], ...] = (
    ("VnExpress", "https://vnexpress.net/rss/thoi-su.rss"),
    ("Tuổi Trẻ", "https://tuoitre.vn/rss/thoi-su.rss"),
    ("Dân Trí", "https://dantri.com.vn/rss/xa-hoi.rss"),
    ("VietNamNet", "https://vietnamnet.vn/rss/chinh-tri.rss"),
)


def _plain_text(value: str | None) -> str:
    if not value:
        return ""
    without_tags = re.sub(r"<[^>]+>", " ", html.unescape(value))
    return re.sub(r"\s+", " ", without_tags).strip()


def _timestamp(value: str | None) -> str:
    if not value:
        return ""
    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.isoformat()
    except (TypeError, ValueError, OverflowError):
        return value


def _fetch_feed(source: str, url: str) -> list[dict[str, Any]]:
    response = requests.get(
        url,
        timeout=20,
        headers={"User-Agent": "LegalRadar/0.1 RSS reader (+public monitoring)"},
    )
    response.raise_for_status()
    root = ElementTree.fromstring(response.content)
    results: list[dict[str, Any]] = []
    for item in root.findall(".//item"):
        title = _plain_text(item.findtext("title"))
        description = _plain_text(item.findtext("description"))
        link = (item.findtext("link") or "").strip()
        text = "\n\n".join(part for part in (title, description) if part)
        if not link or not is_relevant(text):
            continue
        results.append(
            {
                "platform": "web",
                "content_type": "article",
                "text": text,
                "author": source,
                "author_id": "",
                "author_url": "",
                "author_handle": source,
                "url": link,
                "timestamp": _timestamp(
                    item.findtext("pubDate")
                    or item.findtext("{http://purl.org/dc/elements/1.1/}date")
                ),
                "source_name": source,
                "source_type": "press",
                "engagement": {},
                "comments": [],
            }
        )
    return results


def crawl_news(
    keywords: list[str] | None = None,
    max_posts: int = 15,
) -> list[dict[str, Any]]:
    """Collect relevant articles from configured Vietnamese RSS feeds."""
    del keywords  # Domain relevance is applied consistently by filter.py.
    if os.environ.get("CRAWL_NEWS_ENABLED", "true").lower() not in {"1", "true", "yes", "on"}:
        return []

    results: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=len(DEFAULT_FEEDS)) as pool:
        futures = {
            pool.submit(_fetch_feed, source, url): source
            for source, url in DEFAULT_FEEDS
        }
        for future in as_completed(futures):
            try:
                results.extend(future.result())
            except (requests.RequestException, ElementTree.ParseError) as exc:
                logger.warning("News RSS failed for %s: %s", futures[future], exc)

    # Prefer recent entries when feeds return valid ISO timestamps.
    results.sort(key=lambda item: item.get("timestamp", ""), reverse=True)
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for item in results:
        url = item["url"].split("?", 1)[0]
        if url in seen:
            continue
        seen.add(url)
        unique.append(item)
    return unique[:max_posts]
