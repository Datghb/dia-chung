"""Unit tests for crawlers: facebook, youtube, scheduler."""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch


# ── Facebook crawler tests ──

class TestFacebookCrawler:
    """Tests for facebook.py"""

    def test_parse_count_plain_number(self):
        from legal_radar.crawlers.facebook import _parse_count
        assert _parse_count("123") == 123

    def test_parse_count_with_commas(self):
        from legal_radar.crawlers.facebook import _parse_count
        assert _parse_count("1,234") == 1234

    def test_parse_count_k_suffix(self):
        from legal_radar.crawlers.facebook import _parse_count
        assert _parse_count("1.2K") == 1200

    def test_parse_count_m_suffix(self):
        from legal_radar.crawlers.facebook import _parse_count
        assert _parse_count("5M") == 5_000_000

    def test_parse_count_empty(self):
        from legal_radar.crawlers.facebook import _parse_count
        assert _parse_count("") == 0

    def test_parse_count_invalid(self):
        from legal_radar.crawlers.facebook import _parse_count
        assert _parse_count("abc") == 0

    def test_crawl_facebook_no_credentials(self):
        """Should return empty list if no FB credentials."""
        from legal_radar.crawlers.facebook import crawl_facebook
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("FB_USERNAME", None)
            os.environ.pop("FB_PASSWORD", None)
            result = crawl_facebook(keywords=["test"], max_posts=1)
            assert result == []

    def test_crawl_facebook_no_playwright(self):
        """Should return empty list if playwright not installed."""
        from legal_radar.crawlers.facebook import crawl_facebook
        with patch.dict(os.environ, {"FB_USERNAME": "test", "FB_PASSWORD": "test"}):
            with patch.dict("sys.modules", {"playwright": None, "playwright.sync_api": None}):
                result = crawl_facebook(keywords=["test"], max_posts=1)
                assert result == []

    def test_default_keywords_not_empty(self):
        from legal_radar.crawlers.facebook import DEFAULT_KEYWORDS
        assert len(DEFAULT_KEYWORDS) > 0
        assert "tin giả" in DEFAULT_KEYWORDS

    def test_safe_click_text_returns_false_when_missing(self):
        from legal_radar.crawlers.facebook import _safe_click_text
        mock_page = MagicMock()
        mock_result = MagicMock()
        mock_result.count.return_value = 0
        mock_page.get_by_text.return_value = mock_result
        mock_page.wait_for_selector.return_value = None
        result = _safe_click_text(mock_page, "nonexistent", timeout=100)
        assert result is False

    def test_expand_all_comments_returns_int(self):
        """_expand_all_comments returns 0 when no buttons found."""
        from legal_radar.crawlers.facebook import _expand_all_comments
        mock_page = MagicMock()
        mock_result = MagicMock()
        mock_result.count.return_value = 0
        mock_page.get_by_text.return_value = mock_result
        mock_page.wait_for_selector.return_value = None
        result = _expand_all_comments(mock_page, max_clicks=3)
        assert isinstance(result, int)
        assert result == 0

    def test_extract_comments_returns_list(self):
        from legal_radar.crawlers.facebook import _extract_comments
        mock_page = MagicMock()
        mock_page.query_selector_all.return_value = []
        result = _extract_comments(mock_page, max_comments=10)
        assert isinstance(result, list)
        assert result == []


# ── YouTube crawler tests ──

class TestYouTubeCrawler:
    """Tests for youtube.py"""

    def test_parse_timestamp_valid(self):
        from legal_radar.crawlers.youtube import _parse_timestamp
        result = _parse_timestamp("2026-07-17T10:30:00Z")
        assert "2026-07-17" in result

    def test_parse_timestamp_invalid(self):
        from legal_radar.crawlers.youtube import _parse_timestamp
        result = _parse_timestamp("not-a-date")
        assert result  # Should return current time fallback

    def test_parse_timestamp_empty(self):
        from legal_radar.crawlers.youtube import _parse_timestamp
        result = _parse_timestamp("")
        assert result  # Should return current time fallback

    def test_crawl_youtube_no_api_key(self):
        """Should return empty list if YOUTUBE_API_KEY not set."""
        from legal_radar.crawlers.youtube import crawl_youtube
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("YOUTUBE_API_KEY", None)
            result = crawl_youtube(api_key=None)
            assert result == []

    def test_crawl_youtube_no_library(self):
        """Should return empty list if google-api-python-client not installed."""
        with patch.dict("sys.modules", {"googleapiclient": None, "googleapiclient.discovery": None}):
            from legal_radar.crawlers.youtube import crawl_youtube
            result = crawl_youtube(api_key="fake-key")
            assert result == []

    def test_crawl_youtube_with_mock_api(self):
        """Test crawl with mocked YouTube API."""
        from legal_radar.crawlers.youtube import crawl_youtube

        mock_search_resp = {
            "items": [
                {"id": {"videoId": "vid001"}},
                {"id": {"videoId": "vid002"}},
            ]
        }
        mock_videos_resp = {
            "items": [
                {
                    "id": "vid001",
                    "snippet": {
                        "title": "Test Video 1",
                        "description": "Description 1",
                        "channelTitle": "Test Channel",
                        "publishedAt": "2026-07-17T10:00:00Z",
                    },
                    "statistics": {
                        "viewCount": "1000",
                        "likeCount": "50",
                        "commentCount": "10",
                    },
                },
                {
                    "id": "vid002",
                    "snippet": {
                        "title": "Test Video 2",
                        "description": "Description 2",
                        "channelTitle": "Test Channel 2",
                        "publishedAt": "2026-07-16T08:00:00Z",
                    },
                    "statistics": {
                        "viewCount": "5000",
                        "likeCount": "200",
                        "commentCount": "30",
                    },
                },
            ]
        }
        mock_comments_resp = {
            "items": [
                {
                    "snippet": {
                        "topLevelComment": {
                            "snippet": {
                                "textDisplay": "Great video!",
                                "authorDisplayName": "Commenter 1",
                                "publishedAt": "2026-07-17T11:00:00Z",
                                "likeCount": 5,
                            }
                        }
                    }
                }
            ]
        }

        mock_youtube = MagicMock()
        mock_youtube.search().list().execute.return_value = mock_search_resp
        mock_youtube.videos().list().execute.return_value = mock_videos_resp
        mock_youtube.commentThreads().list().execute.return_value = mock_comments_resp

        with patch("legal_radar.crawlers.youtube._get_client", return_value=mock_youtube):
            results = crawl_youtube(keywords=["test"], max_results=2, api_key="fake")

        assert len(results) == 2
        assert results[0]["platform"] == "youtube"
        assert results[0]["content_type"] == "video"
        assert results[0]["text"].startswith("Test Video 1")
        assert results[0]["author"] == "Test Channel"
        assert results[0]["engagement"]["views"] == 1000
        assert len(results[0]["comments"]) == 1
        assert results[0]["comments"][0]["text"] == "Great video!"

    def test_default_keywords_not_empty(self):
        from legal_radar.crawlers.youtube import DEFAULT_KEYWORDS
        assert len(DEFAULT_KEYWORDS) > 0
        assert "tin giả" in DEFAULT_KEYWORDS


# ── Scheduler tests ──

class TestScheduler:
    """Tests for scheduler.py"""

    def test_crawl_now_returns_list(self):
        """crawl_now should return a list (empty when no API keys)."""
        from legal_radar.crawlers.scheduler import crawl_now
        with tempfile.TemporaryDirectory() as tmpdir:
            out = os.path.join(tmpdir, "test_output.jsonl")
            result = crawl_now(keywords=["test"], max_posts_per_platform=1, output_path=out)
            assert isinstance(result, list)

    def test_crawl_now_dedup(self):
        """crawl_now should not write duplicate URLs."""
        from legal_radar.crawlers.scheduler import _load_seen_urls, _append_results

        items = [
            {"url": "https://example.com/1", "platform": "test", "text": "a"},
            {"url": "https://example.com/2", "platform": "test", "text": "b"},
            {"url": "https://example.com/1", "platform": "test", "text": "c"},  # dup
        ]

        with tempfile.TemporaryDirectory() as tmpdir:
            out = Path(tmpdir) / "test.jsonl"
            seen = set()
            appended = _append_results(out, items, seen)
            assert appended == 2  # dup skipped

            # Load and verify
            seen_after = _load_seen_urls(out)
            assert "https://example.com/1" in seen_after
            assert "https://example.com/2" in seen_after

            # Second call with same URLs
            seen2 = _load_seen_urls(out)
            appended2 = _append_results(out, items, seen2)
            assert appended2 == 0  # all dupes

    def test_load_seen_urls_missing_file(self):
        from legal_radar.crawlers.scheduler import _load_seen_urls
        result = _load_seen_urls(Path("/nonexistent/path/file.jsonl"))
        assert result == set()

    def test_load_seen_urls_empty_file(self):
        from legal_radar.crawlers.scheduler import _load_seen_urls
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            f.write("")
            f.flush()
            result = _load_seen_urls(Path(f.name))
            assert result == set()
        os.unlink(f.name)

    def test_load_seen_urls_with_data(self):
        from legal_radar.crawlers.scheduler import _load_seen_urls
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            f.write('{"url": "https://a.com/1"}\n')
            f.write('{"url": "https://a.com/2"}\n')
            f.write('{"no_url": true}\n')
            f.flush()
            result = _load_seen_urls(Path(f.name))
            assert len(result) == 2
            assert "https://a.com/1" in result
        os.unlink(f.name)

    def test_scheduler_start_stop(self):
        from legal_radar.crawlers.scheduler import CrawlScheduler
        with tempfile.TemporaryDirectory() as tmpdir:
            out = os.path.join(tmpdir, "sched_test.jsonl")
            sched = CrawlScheduler(interval_minutes=60, output_path=out)
            assert not sched.is_running
            sched.start()
            assert sched.is_running
            sched.stop()
            assert not sched.is_running

    def test_scheduler_double_start(self):
        from legal_radar.crawlers.scheduler import CrawlScheduler
        with tempfile.TemporaryDirectory() as tmpdir:
            out = os.path.join(tmpdir, "sched_test.jsonl")
            sched = CrawlScheduler(interval_minutes=60, output_path=out)
            sched.start()
            sched.start()  # should warn but not crash
            assert sched.is_running
            sched.stop()

    def test_scheduler_double_stop(self):
        from legal_radar.crawlers.scheduler import CrawlScheduler
        with tempfile.TemporaryDirectory() as tmpdir:
            out = os.path.join(tmpdir, "sched_test.jsonl")
            sched = CrawlScheduler(interval_minutes=60, output_path=out)
            sched.start()
            sched.stop()
            sched.stop()  # should not crash
            assert not sched.is_running

    def test_crawl_now_creates_output_dir(self):
        from legal_radar.crawlers.scheduler import crawl_now
        with tempfile.TemporaryDirectory() as tmpdir:
            nested = os.path.join(tmpdir, "sub", "dir", "output.jsonl")
            crawl_now(keywords=["test"], max_posts_per_platform=1, output_path=nested)
            assert os.path.exists(os.path.dirname(nested))


# ── Fixture data tests ──

class TestFixtureData:
    """Tests for data/fixtures/crawled_sample.json"""

    def test_fixture_file_exists(self):
        fixture_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "fixtures" / "crawled_sample.json"
        assert fixture_path.exists(), f"Fixture not found at {fixture_path}"

    def test_fixture_is_valid_json(self):
        fixture_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "fixtures" / "crawled_sample.json"
        with open(fixture_path, encoding="utf-8") as f:
            data = json.load(f)
        assert isinstance(data, list)
        assert len(data) >= 10

    def test_fixture_has_required_fields(self):
        fixture_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "fixtures" / "crawled_sample.json"
        with open(fixture_path, encoding="utf-8") as f:
            data = json.load(f)
        required = {"platform", "content_type", "text", "author", "url", "timestamp", "engagement", "comments"}
        for item in data:
            assert required.issubset(item.keys()), f"Missing fields in item: {required - item.keys()}"
            assert item["platform"] in ("facebook", "youtube")
            assert item["content_type"] in ("post", "video")
            assert isinstance(item["engagement"], dict)
            assert isinstance(item["comments"], list)

    def test_fixture_has_both_platforms(self):
        fixture_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "fixtures" / "crawled_sample.json"
        with open(fixture_path, encoding="utf-8") as f:
            data = json.load(f)
        platforms = {item["platform"] for item in data}
        assert "facebook" in platforms
        assert "youtube" in platforms

    def test_fixture_comments_have_fields(self):
        fixture_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "fixtures" / "crawled_sample.json"
        with open(fixture_path, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            for comment in item.get("comments", []):
                assert "text" in comment
                assert "author" in comment
                assert "timestamp" in comment
