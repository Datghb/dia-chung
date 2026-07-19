"""Domain relevance filter — only keep posts related to ĐVHC (administrative unit) mergers."""
from __future__ import annotations

from typing import Any

_DVHC_KEYWORDS: list[str] = [
    "sáp nhập",
    "gộp tỉnh",
    "giảm tỉnh",
    "hợp nhất",
    "đơn vị hành chính",
    "dvhc",
    "đvhc",
    "tỉnh mới",
    "thành phố mới",
    "nối tỉnh",
    "16 tỉnh",
    "20 tỉnh",
    "34 tỉnh",
    "166 xã",
    "58 xã",
    "nghị quyết quốc hội",
    "sắp xếp",
    "quy hoạch tỉnh",
    "giảm số lượng",
    "tách tỉnh",
    "nhập tỉnh",
    "chia tỉnh",
    "thay đổi địa giới",
    "nghị quyết",
    "bộ nội vụ",
    "sắp xếp lại",
]

_MERGER_REQUIRED: list[str] = [
    "sáp nhập",
    "gộp tỉnh",
    "giảm tỉnh",
    "hợp nhất",
    "đơn vị hành chính",
    "dvhc",
    "đvhc",
    "tỉnh mới",
    "nối tỉnh",
    "nhập tỉnh",
    "chia tỉnh",
    "sắp xếp đơn vị",
    "sắp xếp lại",
    "thay đổi địa giới",
]

_MIN_KEYWORD_MATCH = 2


def is_relevant(text: str) -> bool:
    """Check if text is related to the ĐVHC domain.

    Requires at least one merger-specific keyword (not just generic
    government terms like 'bộ nội vụ' or 'cấp xã').
    """
    normalized = text.lower()
    has_merger_kw = any(kw in normalized for kw in _MERGER_REQUIRED)
    if not has_merger_kw:
        return False
    matches = sum(1 for kw in _DVHC_KEYWORDS if kw in normalized)
    return matches >= _MIN_KEYWORD_MATCH


def filter_posts(posts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Filter list of posts, keeping only relevant ones."""
    result: list[dict[str, Any]] = []
    for post in posts:
        all_text = post.get("text", "")
        for c in post.get("comments", []):
            all_text += " " + c.get("text", "")
        if is_relevant(all_text):
            result.append(post)
    return result
