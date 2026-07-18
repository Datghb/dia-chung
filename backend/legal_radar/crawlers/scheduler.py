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
    """Run crawl immediately (on-demand). Returns only NEW (unseen) items."""
    kw = keywords or CRAWL_KEYWORDS
    out = Path(output_path) if output_path else _DEFAULT_OUTPUT_DIR / _DEFAULT_OUTPUT_FILE

    seen_urls = _load_seen_urls(out)
    all_items: list[dict[str, Any]] = []

    fb_username = os.environ.get("FB_USERNAME", "")
    fb_password = os.environ.get("FB_PASSWORD", "")
    if fb_username and fb_password:
        fb_results = crawl_facebook(
            keywords=kw, max_posts=max_posts_per_platform,
            fb_username=fb_username, fb_password=fb_password,
        )
        all_items.extend(fb_results)
    else:
        logger.warning("FB_USERNAME/FB_PASSWORD not set — skipping Facebook crawl")

    yt_results = crawl_youtube(
        keywords=kw,
        max_results=YOUTUBE_MAX_RESULTS,
        max_comments_per_video=10,
    )
    all_items.extend(yt_results)

    new_items = [item for item in all_items if item.get("url", "") not in seen_urls]
    appended = _append_results(out, all_items, seen_urls)
    logger.info(
        "crawl_now: %d collected, %d new (unseen) appended to %s",
        len(all_items), appended, out,
    )
    return new_items


def crawl_and_process(
    keywords: list[str] | None = None,
    max_posts_per_platform: int = 20,
    output_path: str | Path | None = None,
    queue_path: str | Path | None = None,
    min_articles: int = 40,
) -> dict[str, Any]:
    """Crawl + pipeline integration: crawled comments -> QueueItem -> queue.jsonl.

    Crawls at least *min_articles* posts/videos, then processes each comment
    through the classification pipeline (LLM if available, else engine-only).

    Returns dict with keys: crawled, comments_found, processed, items, error.
    """
    from dataclasses import asdict
    from uuid import uuid4 as _uuid4

    out = Path(output_path) if output_path else _DEFAULT_OUTPUT_DIR / _DEFAULT_OUTPUT_FILE
    qpath = Path(queue_path) if queue_path else _DEFAULT_OUTPUT_DIR / "queue.jsonl"

    crawled_items = crawl_now(
        keywords=keywords, max_posts_per_platform=max_posts_per_platform, output_path=out,
    )
    if not crawled_items:
        return {"crawled": 0, "comments_found": 0, "processed": 0, "items": [], "error": "No items crawled"}

    if len(crawled_items) < min_articles:
        logger.warning(
            "Crawled only %d articles (target %d) — proceeding with available data",
            len(crawled_items), min_articles,
        )

    try:
        from ..pipeline import CommentIngestor, analyze_comment
        from ..model import load_kg
    except ImportError as exc:
        return {"crawled": len(crawled_items), "comments_found": 0, "processed": 0, "items": [], "error": str(exc)}

    _data_dir = Path(__file__).resolve().parent.parent.parent.parent / "data"
    kg = load_kg(_data_dir / "kg" / "kg_nodes.json", _data_dir / "kg" / "kg_edges.json")

    provider = None
    use_llm = False
    try:
        from ..providers import GeminiProvider, GroqProvider, OpenRouterProvider
        for cls in (GeminiProvider, GroqProvider, OpenRouterProvider):
            try:
                provider = cls()
                use_llm = True
                break
            except Exception:
                continue
    except ImportError:
        pass

    ingestor = CommentIngestor(provider, kg, str(qpath)) if use_llm else None
    if not use_llm:
        logger.info("No LLM provider available — using engine-only classification")

    os.makedirs(qpath.parent, exist_ok=True)

    seen_texts: set[str] = set()
    if qpath.exists():
        with open(qpath, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                    t = str(row.get("text", "")).strip()
                    if t:
                        seen_texts.add(t)
                except (json.JSONDecodeError, KeyError):
                    continue

    processed: list[dict[str, Any]] = []
    comments_found = 0

    with open(qpath, "a", encoding="utf-8") as qf:
        for item in crawled_items:
            comments = item.get("comments", [])
            platform = item.get("platform", "unknown")
            author = item.get("author", "")
            url = item.get("url", "")
            engagement = item.get("engagement", {})
            reach = engagement.get("likes", 0) + engagement.get("shares", 0) + engagement.get("views", 0)

            for c in comments:
                text = c.get("text", "").strip()
                if not text or len(text) < 10:
                    continue
                comments_found += 1

                if text in seen_texts:
                    continue

                comment_id = f"crawl_{_uuid4().hex[:12]}"

                comment_dict = {
                    "id": comment_id,
                    "text": text,
                    "thoi_gian": c.get("timestamp", item.get("timestamp", "")),
                }

                try:
                    if use_llm and ingestor is not None:
                        qi = ingestor.process_one(comment_dict)
                        row = asdict(qi)
                        row["nhan"] = qi.nhan.value
                        row["nhan_nguon"] = qi.nhan_nguon.value
                    else:
                        result = analyze_comment(text)
                        row = {
                            "id": comment_id,
                            "comment_id": comment_id,
                            "text": text,
                            "claim": result.get("claim", text),
                            "keywords": [],
                            "nhan": result["label"].value,
                            "ly_do": result["reason"],
                            "nhan_nguon": result["source_label"].value,
                            "priority": 0,
                        }
                except Exception as exc:
                    logger.warning("Pipeline error for %s: %s", comment_id, exc)
                    row = {
                        "id": comment_id,
                        "comment_id": comment_id,
                        "text": text,
                        "claim": text,
                        "keywords": [],
                        "nhan": "can_kiem_chung",
                        "ly_do": f"Pipeline loi: {str(exc)[:120]}",
                        "nhan_nguon": "chua_tim_thay_nguon",
                        "priority": 0,
                    }

                row["_crawled_meta"] = {
                    "platform": platform,
                    "account": author,
                    "url": url,
                    "published_at": c.get("timestamp", item.get("timestamp", "")),
                    "reach": reach,
                }

                qf.write(json.dumps(row, ensure_ascii=False) + "\n")
                seen_texts.add(text)
                processed.append(row)

    return {
        "crawled": len(crawled_items),
        "comments_found": comments_found,
        "processed": len(processed),
        "items": processed,
        "error": "",
    }


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

