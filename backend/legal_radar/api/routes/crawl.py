"""POST /api/crawl — trigger crawl + pipeline integration."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..schemas import CrawlRequest, CrawlResponse, QueueItemResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["crawl"])


@router.post("/crawl", response_model=CrawlResponse)
def trigger_crawl(request: CrawlRequest) -> CrawlResponse:
    """Trigger crawl -> pipeline -> queue.jsonl. Returns processed items."""
    try:
        from ...crawlers.scheduler import crawl_and_process
    except ImportError as exc:
        raise HTTPException(status_code=500, detail=f"Crawler unavailable: {exc}")

    try:
        result = crawl_and_process(
            keywords=request.keywords or None,
            max_posts_per_platform=request.max_posts_per_platform,
            min_articles=40,
        )
    except Exception as exc:
        logger.error("Crawl+process failed: %s", exc)
        return CrawlResponse(
            crawled=0, comments_found=0, processed=0,
            error=f"Failed: {str(exc)[:200]}",
        )

    if result.get("error"):
        return CrawlResponse(
            crawled=result["crawled"],
            comments_found=result["comments_found"],
            processed=result["processed"],
            error=result["error"],
        )

    items_resp = []
    for row in result.get("items", []):
        meta = row.pop("_crawled_meta", {})
        items_resp.append(QueueItemResponse(
            id=row["id"],
            comment_id=row.get("comment_id", ""),
            text=row.get("text", ""),
            claim=row.get("claim", ""),
            keywords=row.get("keywords", []),
            label=row["nhan"],
            source_label=row["nhan_nguon"],
            reason=row.get("ly_do", ""),
            priority=row.get("priority", 0),
            platform=meta.get("platform", "Forum"),
            account=meta.get("account", ""),
            published_at=meta.get("published_at", ""),
            reach=meta.get("reach", 0),
        ))

    return CrawlResponse(
        crawled=result["crawled"],
        comments_found=result["comments_found"],
        processed=result["processed"],
        items=items_resp,
    )
