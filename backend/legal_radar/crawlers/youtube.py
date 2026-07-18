"""YouTube crawler using Data API v3.

Requires YOUTUBE_API_KEY env var (free tier: 10K units/day).
search.list = 100 units, commentThreads.list = 1 unit per call.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_KEYWORDS: list[str] = [
    "tin giả",
    "phạt MXH",
    "xử phạt mạng xã hội",
    "nghị định 174",
    "fake news",
    "tin sai sự thật",
    "bóc phốt",
    "tin đồn",
]

YOUTUBE_MAX_RESULTS = 10


def _get_client(api_key: str | None = None):
    try:
        from googleapiclient.discovery import build
    except ImportError:
        logger.warning("google-api-python-client not installed")
        return None

    key = api_key or os.environ.get("YOUTUBE_API_KEY")
    if not key:
        logger.warning("YOUTUBE_API_KEY not set")
        return None

    return build("youtube", "v3", developerKey=key)


def _parse_timestamp(raw: str) -> str:
    """Convert YouTube RFC 3339 timestamp to ISO format."""
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.isoformat()
    except (ValueError, AttributeError):
        return datetime.now(timezone.utc).isoformat()


def _get_comments(youtube, video_id: str, max_comments: int = 10) -> list[dict[str, str]]:
    """Fetch top-level comments for a video."""
    comments: list[dict[str, str]] = []
    try:
        resp = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=min(max_comments, 100),
            order="relevance",
            textFormat="plainText",
        ).execute()

        for item in resp.get("items", []):
            snippet = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "text": snippet.get("textDisplay", ""),
                "author": snippet.get("authorDisplayName", "Unknown"),
                "timestamp": _parse_timestamp(snippet.get("publishedAt", "")),
                "likes": snippet.get("likeCount", 0),
            })
    except Exception as exc:
        error_str = str(exc).lower()
        if "quota" in error_str:
            logger.warning("YouTube quota exceeded while fetching comments for %s", video_id)
        elif "commentsDisabled" in str(exc) or "forbidden" in error_str:
            logger.debug("Comments disabled for video %s", video_id)
        else:
            logger.debug("Failed to fetch comments for %s: %s", video_id, exc)

    return comments


def crawl_youtube(
    keywords: list[str] | None = None,
    max_results: int = YOUTUBE_MAX_RESULTS,
    api_key: str | None = None,
    fetch_comments: bool = True,
    max_comments_per_video: int = 10,
) -> list[dict[str, Any]]:
    """Crawl YouTube search for videos matching *keywords*.

    Returns a list of crawled-item dicts, or an empty list if the API
    is unavailable or quota is exceeded.
    """
    youtube = _get_client(api_key)
    if youtube is None:
        return []

    keywords = keywords or DEFAULT_KEYWORDS
    results: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    quota_exceeded = False

    for kw in keywords:
        if quota_exceeded:
            break

        try:
            search_resp = youtube.search().list(
                part="snippet",
                q=kw,
                type="video",
                maxResults=min(max_results, 50),
                order="relevance",
                regionCode="VN",
                relevanceLanguage="vi",
            ).execute()
        except Exception as exc:
            error_str = str(exc).lower()
            if "quota" in error_str:
                logger.warning("YouTube quota exceeded on search for '%s' — stopping", kw)
                quota_exceeded = True
                continue
            logger.warning("YouTube search failed for '%s': %s", kw, exc)
            continue

        video_ids: list[str] = []
        for item in search_resp.get("items", []):
            vid = item["id"].get("videoId", "")
            if vid and vid not in seen_ids:
                video_ids.append(vid)
                seen_ids.add(vid)

        if not video_ids:
            continue

        # Batch fetch video statistics
        try:
            stats_resp = youtube.videos().list(
                part="statistics,snippet",
                id=",".join(video_ids),
            ).execute()
        except Exception as exc:
            error_str = str(exc).lower()
            if "quota" in error_str:
                logger.warning("YouTube quota exceeded on videos.list — stopping")
                quota_exceeded = True
                continue
            logger.warning("videos.list failed: %s", exc)
            continue

        stats_map: dict[str, dict] = {}
        for item in stats_resp.get("items", []):
            stats_map[item["id"]] = item

        for vid in video_ids:
            info = stats_map.get(vid, {})
            snippet = info.get("snippet", {})
            stats = info.get("statistics", {})

            comments: list[dict[str, str]] = []
            if fetch_comments and not quota_exceeded:
                comments = _get_comments(youtube, vid, max_comments_per_video)

            channel_name = snippet.get("channelTitle", "Unknown")
            title = snippet.get("title", "")
            description = snippet.get("description", "")
            published = _parse_timestamp(snippet.get("publishedAt", ""))

            results.append({
                "platform": "youtube",
                "content_type": "video",
                "text": f"{title}\n{description[:500]}".strip(),
                "author": channel_name,
                "url": f"https://www.youtube.com/watch?v={vid}",
                "timestamp": published,
                "engagement": {
                    "views": int(stats.get("viewCount", 0)),
                    "likes": int(stats.get("likeCount", 0)),
                    "comments": int(stats.get("commentCount", 0)),
                },
                "comments": comments,
            })

    logger.info("YouTube crawler collected %d videos", len(results))
    return results
