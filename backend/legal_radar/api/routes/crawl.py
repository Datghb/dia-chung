"""On-demand social crawl endpoint used by the operations dashboard."""

from __future__ import annotations

import json

from fastapi import APIRouter

from ...crawlers.scheduler import _append_results, _load_seen_urls, crawl_now
from ..dependencies import data_dir, runs_dir
from ..schemas import CrawlRequest, CrawlResponse

router = APIRouter(tags=["crawl"])


@router.post("/crawl", response_model=CrawlResponse)
def trigger_crawl(request: CrawlRequest) -> CrawlResponse:
    output_path = runs_dir() / "crawled_raw.jsonl"
    before = len(_load_seen_urls(output_path))
    items = crawl_now(
        keywords=request.keywords or None,
        max_posts_per_platform=request.max_posts_per_platform,
        output_path=output_path,
    )
    mode = "live"

    if not items:
        sample_path = data_dir() / "fixtures" / "crawled_sample.json"
        items = json.loads(sample_path.read_text(encoding="utf-8")) if sample_path.exists() else []
        mode = "fallback"

    _append_results(output_path, items, _load_seen_urls(output_path))
    after = len(_load_seen_urls(output_path))
    added = max(0, after - before)
    message = (
        f"Đã thu thập {len(items)} nội dung trực tiếp."
        if mode == "live"
        else f"Nguồn trực tiếp chưa sẵn sàng; đã nạp {len(items)} nội dung dự phòng để demo."
    )
    return CrawlResponse(collected=len(items), added=added, mode=mode, message=message)
