"""YouTube crawler using the official YouTube Data API v3."""
from __future__ import annotations

import logging
import os
from typing import Any

import requests

logger = logging.getLogger(__name__)

API_BASE = "https://www.googleapis.com/youtube/v3"


def _get(path: str, **params: Any) -> dict[str, Any]:
    params["key"] = os.environ["YOUTUBE_API_KEY"]
    response = requests.get(f"{API_BASE}/{path}", params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def _comments(video_id: str, limit: int = 20) -> list[dict[str, Any]]:
    try:
        data = _get(
            "commentThreads",
            part="snippet",
            videoId=video_id,
            maxResults=min(limit, 100),
            order="relevance",
            textFormat="plainText",
        )
    except requests.RequestException as exc:
        # Comments may be disabled even when the video itself is public.
        logger.info("YouTube comments unavailable for %s: %s", video_id, exc)
        return []

    comments: list[dict[str, Any]] = []
    for item in data.get("items", []):
        snippet = (
            item.get("snippet", {})
            .get("topLevelComment", {})
            .get("snippet", {})
        )
        text = snippet.get("textDisplay") or snippet.get("textOriginal") or ""
        if text:
            comments.append(
                {
                    "text": text,
                    "author": snippet.get("authorDisplayName", "Unknown"),
                    "author_id": snippet.get("authorChannelId", {}).get("value", ""),
                    "author_url": snippet.get("authorChannelUrl", ""),
                    "timestamp": snippet.get("publishedAt", ""),
                    "likes": snippet.get("likeCount", 0),
                    "num_replies": item.get("snippet", {}).get("totalReplyCount", 0),
                }
            )
    return comments


def crawl_youtube(
    keywords: list[str] | None = None,
    max_posts: int = 20,
) -> list[dict[str, Any]]:
    """Search public videos and return normalized video metadata and comments."""
    if not os.environ.get("YOUTUBE_API_KEY"):
        logger.info("Skipping YouTube: YOUTUBE_API_KEY is not configured")
        return []

    queries = keywords or ["sáp nhập tỉnh", "sắp xếp đơn vị hành chính"]
    found: dict[str, dict[str, Any]] = {}
    try:
        for query in queries:
            if len(found) >= max_posts:
                break
            data = _get(
                "search",
                part="snippet",
                q=query,
                type="video",
                maxResults=min(50, max_posts - len(found)),
                order="date",
                relevanceLanguage="vi",
                regionCode="VN",
                safeSearch="moderate",
            )
            for item in data.get("items", []):
                video_id = item.get("id", {}).get("videoId")
                if video_id:
                    found.setdefault(video_id, item.get("snippet", {}))
    except requests.RequestException as exc:
        logger.warning("YouTube search failed: %s", exc)
        return []

    if not found:
        return []

    try:
        details = _get(
            "videos",
            part="snippet,statistics",
            id=",".join(found),
            maxResults=min(50, len(found)),
        )
    except requests.RequestException as exc:
        logger.warning("YouTube video details failed: %s", exc)
        return []

    results: list[dict[str, Any]] = []
    for video in details.get("items", []):
        video_id = video.get("id", "")
        snippet = video.get("snippet", found.get(video_id, {}))
        stats = video.get("statistics", {})
        text = "\n\n".join(
            part for part in (snippet.get("title", ""), snippet.get("description", "")) if part
        )
        results.append(
            {
                "platform": "youtube",
                "content_type": "video",
                "text": text,
                "author": snippet.get("channelTitle", "Unknown"),
                "author_id": snippet.get("channelId", ""),
                "author_url": f"https://www.youtube.com/channel/{snippet.get('channelId', '')}",
                "author_handle": "",
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "timestamp": snippet.get("publishedAt", ""),
                "engagement": {
                    "views": int(stats.get("viewCount", 0)),
                    "likes": int(stats.get("likeCount", 0)),
                    "comments": int(stats.get("commentCount", 0)),
                },
                "comments": _comments(video_id),
            }
        )
    return results[:max_posts]
