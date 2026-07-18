"""Unit tests for crawlers: facebook, youtube, scheduler."""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch


# ── Facebook crawler tests ──

class TestFacebookCrawler:
    """Tests for facebook.py (Bright Data API version)"""

    def test_crawl_facebook_no_api_key(self):
        from legal_radar.crawlers.facebook import crawl_facebook
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("BRIGHTDATA_API_KEY", None)
            result = crawl_facebook(max_posts=1, fb_username="test", fb_password="test")
            assert result == []

    def test_crawl_facebook_no_credentials(self):
        from legal_radar.crawlers.facebook import crawl_facebook
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            result = crawl_facebook(max_posts=1, fb_username="", fb_password="")
            assert result == []

    def test_crawl_facebook_no_playwright(self):
        from legal_radar.crawlers.facebook import crawl_facebook
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake", "FB_USERNAME": "test", "FB_PASSWORD": "test"}):
            with patch.dict("sys.modules", {"playwright": None, "playwright.sync_api": None}):
                result = crawl_facebook(max_posts=1, fb_username="test", fb_password="test")
                assert result == []

    def test_bd_scrape_sync_response(self):
        from legal_radar.crawlers.facebook import _bd_scrape
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [{"content": "test post", "post_id": "123"}]
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("legal_radar.crawlers.facebook.requests.post", return_value=mock_resp):
                result = _bd_scrape("dataset_id", "https://fb.com/123")
                assert len(result) == 1
                assert result[0]["content"] == "test post"

    def test_bd_scrape_error_filtered(self):
        from legal_radar.crawlers.facebook import _bd_scrape
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {"content": "good", "post_id": "1"},
            {"error": "dead_page"},
        ]
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("legal_radar.crawlers.facebook.requests.post", return_value=mock_resp):
                result = _bd_scrape("dataset_id", "https://fb.com/123")
                assert len(result) == 1

    def test_bd_scrape_timeout(self):
        import requests as req
        from legal_radar.crawlers.facebook import _bd_scrape
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("legal_radar.crawlers.facebook.requests.post", side_effect=req.Timeout):
                result = _bd_scrape("dataset_id", "https://fb.com/123")
                assert result == []

    def test_crawl_one_post_success(self):
        from legal_radar.crawlers.facebook import _crawl_one_post
        mock_post = [{"content": "Test post about fake news", "post_id": "123",
                       "url": "https://fb.com/123", "user_username_raw": "TestUser",
                       "date_posted": "2026-07-17", "likes": 100, "num_shares": 10,
                       "num_comments": 5, "num_likes_type": []}]
        mock_comments = [{"comment_text": "Great post!", "user_name": "Commenter1",
                          "date_created": "2026-07-17", "num_likes": 3,
                          "post_id": "123", "post_url": "https://fb.com/123"}]
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("legal_radar.crawlers.facebook._bd_scrape") as mock_scrape:
                mock_scrape.side_effect = [mock_post, mock_comments]
                result = _crawl_one_post("https://fb.com/123")
                assert result is not None
                assert result["platform"] == "facebook"
                assert result["author"] == "TestUser"
                assert len(result["comments"]) == 1
                assert result["comments"][0]["text"] == "Great post!"

    def test_crawl_one_post_no_content(self):
        from legal_radar.crawlers.facebook import _crawl_one_post
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("legal_radar.crawlers.facebook._bd_scrape", return_value=[]):
                result = _crawl_one_post("https://fb.com/123")
                assert result is None

    def test_crawl_one_post_short_content(self):
        from legal_radar.crawlers.facebook import _crawl_one_post
        mock_post = [{"content": "short", "post_id": "123"}]
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("legal_radar.crawlers.facebook._bd_scrape", return_value=mock_post):
                result = _crawl_one_post("https://fb.com/123")
                assert result is None


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
        assert result

    def test_parse_timestamp_empty(self):
        from legal_radar.crawlers.youtube import _parse_timestamp
        result = _parse_timestamp("")
        assert result

    def test_crawl_youtube_no_api_key(self):
        from legal_radar.crawlers.youtube import crawl_youtube
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("YOUTUBE_API_KEY", None)
            result = crawl_youtube(api_key=None)
            assert result == []

    def test_crawl_youtube_no_library(self):
        with patch.dict("sys.modules", {"googleapiclient": None, "googleapiclient.discovery": None}):
            from legal_radar.crawlers.youtube import crawl_youtube
            result = crawl_youtube(api_key="fake-key")
            assert result == []

    def test_crawl_youtube_with_mock_api(self):
        from legal_radar.crawlers.youtube import crawl_youtube
        mock_search_resp = {"items": [{"id": {"videoId": "vid001"}}, {"id": {"videoId": "vid002"}}]}
        mock_videos_resp = {"items": [
            {"id": "vid001", "snippet": {"title": "Test Video 1", "description": "Desc 1",
                                          "channelTitle": "Channel 1", "publishedAt": "2026-07-17T10:00:00Z"},
             "statistics": {"viewCount": "1000", "likeCount": "50", "commentCount": "10"}},
            {"id": "vid002", "snippet": {"title": "Test Video 2", "description": "Desc 2",
                                          "channelTitle": "Channel 2", "publishedAt": "2026-07-16T08:00:00Z"},
             "statistics": {"viewCount": "5000", "likeCount": "200", "commentCount": "30"}},
        ]}
        mock_comments_resp = {"items": [{"snippet": {"topLevelComment": {"snippet": {
            "textDisplay": "Great!", "authorDisplayName": "User1",
            "publishedAt": "2026-07-17T11:00:00Z", "likeCount": 5}}}}]}
        mock_youtube = MagicMock()
        mock_youtube.search().list().execute.return_value = mock_search_resp
        mock_youtube.videos().list().execute.return_value = mock_videos_resp
        mock_youtube.commentThreads().list().execute.return_value = mock_comments_resp
        with patch("legal_radar.crawlers.youtube._get_client", return_value=mock_youtube):
            results = crawl_youtube(keywords=["test"], max_results=2, api_key="fake")
        assert len(results) == 2
        assert results[0]["platform"] == "youtube"
        assert results[0]["engagement"]["views"] == 1000
        assert len(results[0]["comments"]) == 1

    def test_default_keywords_not_empty(self):
        from legal_radar.crawlers.youtube import DEFAULT_KEYWORDS
        assert len(DEFAULT_KEYWORDS) > 0


# ── Scheduler tests ──

class TestScheduler:
    """Tests for scheduler.py"""

    def test_crawl_now_returns_list(self):
        from legal_radar.crawlers.scheduler import crawl_now
        with tempfile.TemporaryDirectory() as tmpdir:
            out = os.path.join(tmpdir, "test_output.jsonl")
            result = crawl_now(keywords=["test"], max_posts_per_platform=1, output_path=out)
            assert isinstance(result, list)

    def test_crawl_now_dedup(self):
        from legal_radar.crawlers.scheduler import _load_seen_urls, _append_results
        items = [
            {"url": "https://example.com/1", "platform": "test", "text": "a"},
            {"url": "https://example.com/2", "platform": "test", "text": "b"},
            {"url": "https://example.com/1", "platform": "test", "text": "c"},
        ]
        with tempfile.TemporaryDirectory() as tmpdir:
            out = Path(tmpdir) / "test.jsonl"
            seen = set()
            appended = _append_results(out, items, seen)
            assert appended == 2
            seen_after = _load_seen_urls(out)
            assert "https://example.com/1" in seen_after

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
            f.write('{"url": "https://a.com/1"}\n{"url": "https://a.com/2"}\n{"no_url": true}\n')
            f.flush()
            result = _load_seen_urls(Path(f.name))
            assert len(result) == 2
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
            sched = CrawlScheduler(interval_minutes=60, output_path=os.path.join(tmpdir, "t.jsonl"))
            sched.start()
            sched.start()
            assert sched.is_running
            sched.stop()

    def test_scheduler_double_stop(self):
        from legal_radar.crawlers.scheduler import CrawlScheduler
        with tempfile.TemporaryDirectory() as tmpdir:
            sched = CrawlScheduler(interval_minutes=60, output_path=os.path.join(tmpdir, "t.jsonl"))
            sched.start()
            sched.stop()
            sched.stop()
            assert not sched.is_running

    def test_crawl_now_creates_output_dir(self):
        from legal_radar.crawlers.scheduler import crawl_now
        with tempfile.TemporaryDirectory() as tmpdir:
            nested = os.path.join(tmpdir, "sub", "dir", "output.jsonl")
            crawl_now(keywords=["test"], max_posts_per_platform=1, output_path=nested)
            assert os.path.exists(os.path.dirname(nested))

    def test_crawl_now_returns_only_new_items(self):
        from legal_radar.crawlers.scheduler import crawl_now
        with tempfile.TemporaryDirectory() as tmpdir:
            out = Path(tmpdir) / "output.jsonl"
            items_a = [
                {"url": "https://a.com/1", "platform": "test", "text": "a"},
                {"url": "https://a.com/2", "platform": "test", "text": "b"},
            ]
            items_b = [
                {"url": "https://a.com/1", "platform": "test", "text": "a"},
                {"url": "https://a.com/3", "platform": "test", "text": "c"},
            ]
            env = {"FB_USERNAME": "test", "FB_PASSWORD": "test", "BRIGHTDATA_API_KEY": "fake"}
            with patch.dict(os.environ, env), \
                 patch("legal_radar.crawlers.scheduler.crawl_facebook", return_value=items_a), \
                 patch("legal_radar.crawlers.scheduler.crawl_youtube", return_value=[]):
                first = crawl_now(keywords=["test"], output_path=out)
            assert len(first) == 2

            with patch.dict(os.environ, env), \
                 patch("legal_radar.crawlers.scheduler.crawl_facebook", return_value=items_b), \
                 patch("legal_radar.crawlers.scheduler.crawl_youtube", return_value=[]):
                second = crawl_now(keywords=["test"], output_path=out)
            assert len(second) == 1
            assert second[0]["url"] == "https://a.com/3"

    def test_crawl_and_process_dedup_by_text(self):
        from legal_radar.crawlers.scheduler import crawl_and_process
        with tempfile.TemporaryDirectory() as tmpdir:
            out = Path(tmpdir) / "crawled.jsonl"
            qpath = Path(tmpdir) / "queue.jsonl"
            items = [
                {"url": "https://a.com/1", "platform": "facebook", "author": "User1",
                 "timestamp": "2026-07-17", "engagement": {"likes": 10},
                 "comments": [
                     {"text": "This is a unique comment for testing A", "author": "C1", "timestamp": "2026-07-17"},
                     {"text": "This is a unique comment for testing B", "author": "C2", "timestamp": "2026-07-17"},
                 ]},
            ]
            env = {"FB_USERNAME": "test", "FB_PASSWORD": "test", "BRIGHTDATA_API_KEY": "fake"}
            with patch.dict(os.environ, env), \
                 patch("legal_radar.crawlers.scheduler.crawl_facebook", return_value=items), \
                 patch("legal_radar.crawlers.scheduler.crawl_youtube", return_value=[]):
                result1 = crawl_and_process(output_path=out, queue_path=str(qpath))
            assert result1["processed"] == 2

            items_dup = [
                {"url": "https://a.com/2", "platform": "facebook", "author": "User2",
                 "timestamp": "2026-07-18", "engagement": {"likes": 5},
                 "comments": [
                     {"text": "This is a unique comment for testing A", "author": "C1", "timestamp": "2026-07-17"},
                     {"text": "This is a brand new comment here", "author": "C3", "timestamp": "2026-07-18"},
                 ]},
            ]
            with patch.dict(os.environ, env), \
                 patch("legal_radar.crawlers.scheduler.crawl_facebook", return_value=items_dup), \
                 patch("legal_radar.crawlers.scheduler.crawl_youtube", return_value=[]):
                result2 = crawl_and_process(output_path=out, queue_path=str(qpath))
            assert result2["processed"] == 1
            assert result2["items"][0]["text"] == "This is a brand new comment here"

    def test_crawl_and_process_empty_crawl(self):
        from legal_radar.crawlers.scheduler import crawl_and_process
        with tempfile.TemporaryDirectory() as tmpdir:
            out = Path(tmpdir) / "crawled.jsonl"
            qpath = Path(tmpdir) / "queue.jsonl"
            with patch("legal_radar.crawlers.scheduler.crawl_facebook", return_value=[]), \
                 patch("legal_radar.crawlers.scheduler.crawl_youtube", return_value=[]):
                result = crawl_and_process(output_path=out, queue_path=str(qpath))
            assert result["crawled"] == 0
            assert result["processed"] == 0
            assert "No items crawled" in result["error"]


# ── Fixture data tests ──

class TestFixtureData:
    """Tests for data/fixtures/crawled_sample.json"""

    def test_fixture_file_exists(self):
        fixture_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "fixtures" / "crawled_sample.json"
        assert fixture_path.exists()

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
            assert required.issubset(item.keys())

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
