"""Crawler scheduler — on-demand + periodic background crawling.

Appends results to runs/crawled_raw.jsonl with URL-based dedup.
Thread-safe for background execution.
"""
from __future__ import annotations

import json
import logging
import os
import threading
from pathlib import Path
from typing import Any

from .facebook import crawl_facebook
from .youtube import crawl_youtube

logger = logging.getLogger(__name__)

CRAWL_INTERVAL_MINUTES = 15
CRAWL_KEYWORDS: list[str] = [
    "tin giả", "phạt MXH", "xử phạt mạng xã hội",
    "nghị định 174", "fake news", "tin sai sự thật",
]
YOUTUBE_MAX_RESULTS = 10

_DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent.parent.parent.parent / "runs"
_DEFAULT_OUTPUT_FILE = "crawled_raw.jsonl"


def _load_seen_urls(path: Path) -> set[str]:
    """Load already-crawled URLs from the JSONL output file."""
    seen: set[str] = set()
    if not path.exists():
        return seen
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    url = data.get("url", "")
                    if url:
                        seen.add(url)
                except (json.JSONDecodeError, KeyError):
                    continue
    except OSError:
        pass
    return seen


def _append_results(path: Path, items: list[dict[str, Any]], seen_urls: set[str]) -> int:
    """Append new items to JSONL file, skipping already-seen URLs. Returns count appended."""
    os.makedirs(path.parent, exist_ok=True)
    appended = 0
    with open(path, "a", encoding="utf-8") as f:
        for item in items:
            url = item.get("url", "")
            if url and url in seen_urls:
                continue
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
            f.flush()
            if url:
                seen_urls.add(url)
            appended += 1
    return appended


def crawl_now(
    keywords: list[str] | None = None,
    max_posts_per_platform: int = 20,
    output_path: str | Path | None = None,
) -> list[dict[str, Any]]:
    """Run crawl immediately (on-demand). Returns all crawled items."""
    kw = keywords or CRAWL_KEYWORDS
    out = Path(output_path) if output_path else _DEFAULT_OUTPUT_DIR / _DEFAULT_OUTPUT_FILE

    seen_urls = _load_seen_urls(out)
    all_items: list[dict[str, Any]] = []

    fb_results = crawl_facebook(keywords=kw, max_posts=max_posts_per_platform)
    all_items.extend(fb_results)

    yt_results = crawl_youtube(
        keywords=kw,
        max_results=YOUTUBE_MAX_RESULTS,
        max_comments_per_video=10,
    )
    all_items.extend(yt_results)

    appended = _append_results(out, all_items, seen_urls)
    logger.info(
        "crawl_now: %d items collected, %d new appended to %s",
        len(all_items), appended, out,
    )
    return all_items


class CrawlScheduler:
    """Background scheduler that runs crawlers every *interval_minutes* minutes.

    Thread-safe — uses a threading.Timer internally.
    """

    def __init__(
        self,
        interval_minutes: int = CRAWL_INTERVAL_MINUTES,
        keywords: list[str] | None = None,
        max_posts_per_platform: int = 20,
        output_path: str | Path | None = None,
    ) -> None:
        self.interval_minutes = interval_minutes
        self.keywords = keywords or CRAWL_KEYWORDS
        self.max_posts = max_posts_per_platform
        self.output_path = Path(output_path) if output_path else _DEFAULT_OUTPUT_DIR / _DEFAULT_OUTPUT_FILE

        self._lock = threading.Lock()
        self._timer: threading.Timer | None = None
        self._running = False
        self._stop_event = threading.Event()

    @property
    def is_running(self) -> bool:
        with self._lock:
            return self._running

    def start(self) -> None:
        """Start the background scheduler."""
        with self._lock:
            if self._running:
                logger.warning("CrawlScheduler already running")
                return
            self._running = True
            self._stop_event.clear()
            logger.info("CrawlScheduler started (interval=%d min)", self.interval_minutes)
        self._schedule_next()

    def stop(self) -> None:
        """Stop the background scheduler."""
        with self._lock:
            if not self._running:
                return
            self._running = False
            self._stop_event.set()
            if self._timer is not None:
                self._timer.cancel()
                self._timer = None
            logger.info("CrawlScheduler stopped")

    def _schedule_next(self) -> None:
        with self._lock:
            if not self._running:
                return
            self._timer = threading.Timer(
                self.interval_minutes * 60,
                self._run_cycle,
            )
            self._timer.daemon = True
            self._timer.start()

    def _run_cycle(self) -> None:
        if self._stop_event.is_set():
            return
        try:
            logger.info("CrawlScheduler: starting crawl cycle")
            items = crawl_now(
                keywords=self.keywords,
                max_posts_per_platform=self.max_posts,
                output_path=self.output_path,
            )
            logger.info("CrawlScheduler: cycle complete — %d items", len(items))
        except Exception as exc:
            logger.error("CrawlScheduler: cycle failed — %s", exc)
        finally:
            self._schedule_next()

    def run_once(self) -> list[dict[str, Any]]:
        """Trigger a single crawl cycle immediately (blocking)."""
        return crawl_now(
            keywords=self.keywords,
            max_posts_per_platform=self.max_posts,
            output_path=self.output_path,
        )

