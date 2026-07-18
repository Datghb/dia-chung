"""On-demand social crawl endpoint used by the operations dashboard."""

from __future__ import annotations

import json

from fastapi import APIRouter

from ...crawlers.scheduler import crawl_and_process
from ...pipeline import ingest_crawled_items
from ..dependencies import data_dir, runs_dir
from ..schemas import CrawlRequest, CrawlResponse

router = APIRouter(tags=["crawl"])


@router.post("/crawl", response_model=CrawlResponse)
def trigger_crawl(request: CrawlRequest) -> CrawlResponse:
    output_path = runs_dir() / "crawled_raw.jsonl"
    result = crawl_and_process(
        keywords=request.keywords or None,
        max_posts=request.max_posts_per_platform,
        output_path=output_path,
    )
    crawled = result["crawled"]
    relevant = result["relevant"]
    items = result["items"]
    mode = "live"

    if not items:
        sample_path = data_dir() / "fixtures" / "crawled_sample.json"
        items = json.loads(sample_path.read_text(encoding="utf-8")) if sample_path.exists() else []
        mode = "fallback"

    message = (
        f"Đã thu thập {crawled} nội dung, {relevant} liên quan ĐVHC."
        if mode == "live"
        else f"Nguồn trực tiếp chưa sẵn sàng; đã nạp {len(items)} nội dung dự phòng để demo."
    )
    try:
        queue_items = ingest_crawled_items(items)
    except Exception as exc:
        queue_items = []
        message = f"{message} Phân tích queue thất bại: {str(exc)[:160]}"

    return CrawlResponse(
        collected=crawled,
        added=relevant,
        mode=mode,
        message=message,
        analyzed=len(queue_items),
        queue_item_ids=[item.id for item in queue_items],
    )
