"""Source verification boundary.

Wraps source_search + source_classifier into a single entry point.
"""

from __future__ import annotations

import logging

from backend.legal_radar.model import SourceLabel
from backend.legal_radar.source_classifier import xac_thuc_nguon
from backend.legal_radar.source_search import search_brightdata

logger = logging.getLogger(__name__)


def verify_source(
    claim_keywords: list[str],
    thoi_gian: str = "",
) -> tuple[SourceLabel, list[dict], str]:
    """Run full source verification pipeline.

    1. Dynamic search via LLM (Gemini/TokenRouter)
    2. Classify tiers + apply fusion rules

    Returns:
        (nhan_nguon, matched_docs, ly_do)
    """
    try:
        search_results = search_brightdata(claim_keywords, thoi_gian)
    except Exception as exc:
        logger.warning("Source search failed: %s", exc)
        search_results = []

    nhan, docs, ly_do = xac_thuc_nguon(claim_keywords, thoi_gian, search_results)
    return nhan, docs, ly_do
