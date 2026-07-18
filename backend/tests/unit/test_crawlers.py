"""Unit tests for crawlers: facebook, scheduler, cleaner, filter."""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch


# ── Facebook crawler tests ──

class TestFacebookCrawler:
    """Tests for facebook.py (Bright Data Discover + Scraper API)"""

    def test_crawl_facebook_no_api_key(self):
        from backend.legal_radar.crawlers.facebook import crawl_facebook
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("BRIGHTDATA_API_KEY", None)
            result = crawl_facebook(max_posts=1)
            assert result == []

    def test_discover_urls_success(self):
        from backend.legal_radar.crawlers.facebook import _discover_urls
        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = {"task_id": "abc123"}
        mock_poll_resp = MagicMock()
        mock_poll_resp.status_code = 200
        mock_poll_resp.json.return_value = {
            "status": "done",
            "results": [
                {"link": "https://www.facebook.com/user/posts/111", "title": "Test"},
                {"link": "https://www.facebook.com/user/posts/222", "title": "Test2"},
            ],
        }
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("backend.legal_radar.crawlers.facebook.requests.post", return_value=mock_post_resp):
                with patch("backend.legal_radar.crawlers.facebook.requests.get", return_value=mock_poll_resp):
                    urls = _discover_urls(["test query"], 10)
                    assert len(urls) == 2
                    assert "https://www.facebook.com/user/posts/111" in urls

    def test_discover_urls_filters_non_facebook(self):
        from backend.legal_radar.crawlers.facebook import _discover_urls
        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = {"task_id": "abc123"}
        mock_poll_resp = MagicMock()
        mock_poll_resp.status_code = 200
        mock_poll_resp.json.return_value = {
            "status": "done",
            "results": [
                {"link": "https://www.facebook.com/user/posts/111", "title": "FB"},
                {"link": "https://example.com/article", "title": "Not FB"},
            ],
        }
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("backend.legal_radar.crawlers.facebook.requests.post", return_value=mock_post_resp):
                with patch("backend.legal_radar.crawlers.facebook.requests.get", return_value=mock_poll_resp):
                    urls = _discover_urls(["test"], 10)
                    assert len(urls) == 1
                    assert "facebook.com" in urls[0]

    def test_bd_scrape_sync_response(self):
        from backend.legal_radar.crawlers.facebook import _bd_scrape
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [{"content": "test post", "post_id": "123"}]
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("backend.legal_radar.crawlers.facebook.requests.post", return_value=mock_resp):
                result = _bd_scrape("dataset_id", "https://fb.com/123")
                assert len(result) == 1
                assert result[0]["content"] == "test post"

    def test_bd_scrape_error_filtered(self):
        from backend.legal_radar.crawlers.facebook import _bd_scrape
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {"content": "good", "post_id": "1"},
            {"error": "dead_page"},
        ]
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("backend.legal_radar.crawlers.facebook.requests.post", return_value=mock_resp):
                result = _bd_scrape("dataset_id", "https://fb.com/123")
                assert len(result) == 1

    def test_bd_scrape_timeout(self):
        import requests as req
        from backend.legal_radar.crawlers.facebook import _bd_scrape
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("backend.legal_radar.crawlers.facebook.requests.post", side_effect=req.Timeout):
                result = _bd_scrape("dataset_id", "https://fb.com/123")
                assert result == []

    def test_crawl_one_post_success(self):
        from backend.legal_radar.crawlers.facebook import _crawl_one_post, BD_POSTS_DATASET, BD_COMMENTS_DATASET
        mock_post = [{"content": "Test post about fake news", "post_id": "123",
                       "url": "https://fb.com/123", "user_username_raw": "TestUser",
                       "user_url": "https://fb.com/testuser", "profile_id": "uid123",
                       "profile_handle": "testuser", "page_url": "https://fb.com/testuser",
                       "page_followers": 1000, "page_is_verified": True,
                       "date_posted": "2026-07-17", "likes": 100, "num_shares": 10,
                       "num_comments": 5, "num_likes_type": []}]
        mock_comments = [{"comment_text": "Great post!", "user_name": "Commenter1",
                          "user_id": "cuid1", "user_url": "https://fb.com/commenter1",
                          "date_created": "2026-07-17", "num_likes": 3, "num_replies": 0,
                          "post_id": "123", "post_url": "https://fb.com/123"}]

        def mock_scrape(dataset_id, url):
            if dataset_id == BD_POSTS_DATASET:
                return mock_post
            return mock_comments

        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("backend.legal_radar.crawlers.facebook._bd_scrape", side_effect=mock_scrape):
                result = _crawl_one_post("https://fb.com/123")
                assert result is not None
                assert result["platform"] == "facebook"
                assert result["author"] == "TestUser"
                assert result["author_id"] == "uid123"
                assert result["author_url"] == "https://fb.com/testuser"
                assert result["page_followers"] == 1000
                assert result["page_verified"] is True
                assert len(result["comments"]) == 1
                assert result["comments"][0]["text"] == "Great post!"
                assert result["comments"][0]["author_id"] == "cuid1"
                assert result["comments"][0]["author_url"] == "https://fb.com/commenter1"

    def test_crawl_one_post_no_content(self):
        from backend.legal_radar.crawlers.facebook import _crawl_one_post
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("backend.legal_radar.crawlers.facebook._bd_scrape", return_value=[]):
                result = _crawl_one_post("https://fb.com/123")
                assert result is None

    def test_crawl_one_post_short_content(self):
        from backend.legal_radar.crawlers.facebook import _crawl_one_post
        mock_post = [{"content": "short", "post_id": "123"}]
        with patch.dict(os.environ, {"BRIGHTDATA_API_KEY": "fake"}):
            with patch("backend.legal_radar.crawlers.facebook._bd_scrape", return_value=mock_post):
                result = _crawl_one_post("https://fb.com/123")
                assert result is None


# ── YouTube crawler tests ──

# ── Scheduler tests ──

class TestScheduler:
    """Tests for scheduler.py"""

    def test_crawl_now_returns_list(self):
        from backend.legal_radar.crawlers.scheduler import crawl_now
        with tempfile.TemporaryDirectory() as tmpdir:
            out = os.path.join(tmpdir, "test_output.jsonl")
            result = crawl_now(keywords=["test"], max_posts_per_platform=1, output_path=out)
            assert isinstance(result, list)

    def test_crawl_now_dedup(self):
        from backend.legal_radar.crawlers.scheduler import _load_seen_urls, _append_results
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
        from backend.legal_radar.crawlers.scheduler import _load_seen_urls
        result = _load_seen_urls(Path("/nonexistent/path/file.jsonl"))
        assert result == set()

    def test_load_seen_urls_empty_file(self):
        from backend.legal_radar.crawlers.scheduler import _load_seen_urls
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            f.write("")
            f.flush()
            result = _load_seen_urls(Path(f.name))
            assert result == set()
        os.unlink(f.name)

    def test_load_seen_urls_with_data(self):
        from backend.legal_radar.crawlers.scheduler import _load_seen_urls
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            f.write('{"url": "https://a.com/1"}\n{"url": "https://a.com/2"}\n{"no_url": true}\n')
            f.flush()
            result = _load_seen_urls(Path(f.name))
            assert len(result) == 2
        os.unlink(f.name)

    def test_scheduler_start_stop(self):
        from backend.legal_radar.crawlers.scheduler import CrawlScheduler
        with tempfile.TemporaryDirectory() as tmpdir:
            out = os.path.join(tmpdir, "sched_test.jsonl")
            sched = CrawlScheduler(interval_minutes=60, output_path=out)
            assert not sched.is_running
            sched.start()
            assert sched.is_running
            sched.stop()
            assert not sched.is_running

    def test_scheduler_double_start(self):
        from backend.legal_radar.crawlers.scheduler import CrawlScheduler
        with tempfile.TemporaryDirectory() as tmpdir:
            sched = CrawlScheduler(interval_minutes=60, output_path=os.path.join(tmpdir, "t.jsonl"))
            sched.start()
            sched.start()
            assert sched.is_running
            sched.stop()

    def test_scheduler_double_stop(self):
        from backend.legal_radar.crawlers.scheduler import CrawlScheduler
        with tempfile.TemporaryDirectory() as tmpdir:
            sched = CrawlScheduler(interval_minutes=60, output_path=os.path.join(tmpdir, "t.jsonl"))
            sched.start()
            sched.stop()
            sched.stop()
            assert not sched.is_running

    def test_crawl_now_creates_output_dir(self):
        from backend.legal_radar.crawlers.scheduler import crawl_now
        with tempfile.TemporaryDirectory() as tmpdir:
            nested = os.path.join(tmpdir, "sub", "dir", "output.jsonl")
            crawl_now(keywords=["test"], max_posts_per_platform=1, output_path=nested)
            assert os.path.exists(os.path.dirname(nested))


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

    def test_fixture_has_facebook_platform(self):
        fixture_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "fixtures" / "crawled_sample.json"
        with open(fixture_path, encoding="utf-8") as f:
            data = json.load(f)
        platforms = {item["platform"] for item in data}
        assert "facebook" in platforms

    def test_fixture_comments_have_fields(self):
        fixture_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "fixtures" / "crawled_sample.json"
        with open(fixture_path, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            for comment in item.get("comments", []):
                assert "text" in comment
                assert "author" in comment
                assert "timestamp" in comment


# ── Cleaner tests ──

class TestCleaner:
    """Tests for cleaner.py"""

    def test_clean_post_empty_text(self):
        from backend.legal_radar.crawlers.cleaner import clean_post
        assert clean_post({"text": ""}) is None
        assert clean_post({"text": None}) is None

    def test_clean_post_short_text(self):
        from backend.legal_radar.crawlers.cleaner import clean_post
        assert clean_post({"text": "short"}) is None
        assert clean_post({"text": "123456789"}) is None

    def test_clean_post_removes_ui_comments(self):
        from backend.legal_radar.crawlers.cleaner import clean_post
        raw = {
            "text": "This is a real post with enough text",
            "platform": "facebook",
            "content_type": "post",
            "author": "Test",
            "url": "https://fb.com/1",
            "timestamp": "2026-07-17",
            "engagement": {},
            "comments": [
                {"text": "Find friends", "author": "Unknown"},
                {"text": "View Post", "author": "Unknown"},
                {"text": "See more", "author": "Unknown"},
            ],
        }
        result = clean_post(raw)
        assert result is not None
        assert len(result["comments"]) == 0

    def test_clean_post_preserves_real_comments(self):
        from backend.legal_radar.crawlers.cleaner import clean_post
        raw = {
            "text": "This is a real post with enough text",
            "platform": "facebook",
            "content_type": "post",
            "author": "Test",
            "url": "https://fb.com/1",
            "timestamp": "2026-07-17",
            "engagement": {},
            "comments": [
                {"text": "This is a real comment", "author": "User1"},
                {"text": "Find friends", "author": "Unknown"},
            ],
        }
        result = clean_post(raw)
        assert result is not None
        assert len(result["comments"]) == 1
        assert result["comments"][0]["text"] == "This is a real comment"

    def test_clean_comment_ui_garbage(self):
        from backend.legal_radar.crawlers.cleaner import clean_comment
        assert clean_comment("Find friends") is None
        assert clean_comment("View Post") is None
        assert clean_comment("See more") is None
        assert clean_comment("No comments yet") is None
        assert clean_comment("Be the first to comment.") is None

    def test_clean_comment_random_hash(self):
        from backend.legal_radar.crawlers.cleaner import clean_comment
        assert clean_comment("eNsGE3GowjrrIxF77yr4EWqVTfQsjD1Yvk4p6lQq9j2PI51ATvIlLFHqussFY3OWNYkx74WxoRj") is None

    def test_clean_comment_preserves_vietnamese(self):
        from backend.legal_radar.crawlers.cleaner import clean_comment
        result = clean_comment("Đây là bình luận tiếng Việt thật")
        assert result == "Đây là bình luận tiếng Việt thật"

    def test_clean_post_from_crawled_raw(self):
        from backend.legal_radar.crawlers.cleaner import clean_post
        crawled_path = Path(__file__).resolve().parent.parent.parent.parent / "runs" / "crawled_raw.jsonl"
        if not crawled_path.exists():
            return
        with open(crawled_path, encoding="utf-8") as f:
            lines = f.readlines()
        line10 = json.loads(lines[9])
        result = clean_post(line10)
        assert result is not None
        assert "SCAM" in result["text"]

    def test_clean_comment_multiline_ui_garbage(self):
        from backend.legal_radar.crawlers.cleaner import clean_comment
        garbage = "n\np\nd\nS\no\no\nt\ne\ns\nr\n1\nl\n3\n0"
        result = clean_comment(garbage)
        assert result is None


# ── Filter tests ──

class TestFilter:
    """Tests for filter.py"""

    def test_is_relevant_sap_nhap_tinh(self):
        from backend.legal_radar.crawlers.filter import is_relevant
        assert is_relevant("sáp nhập tỉnh và 34 tỉnh còn 16") is True

    def test_is_relevant_single_keyword(self):
        from backend.legal_radar.crawlers.filter import is_relevant
        assert is_relevant("sáp nhập") is False

    def test_is_relevant_no_match(self):
        from backend.legal_radar.crawlers.filter import is_relevant
        assert is_relevant("hôm nay trời đẹp") is False

    def test_is_relevant_dvhc_keywords(self):
        from backend.legal_radar.crawlers.filter import is_relevant
        assert is_relevant("đơn vị hành chính cấp tỉnh sắp xếp") is True

    def test_filter_posts_keeps_relevant(self):
        from backend.legal_radar.crawlers.filter import filter_posts
        posts = [
            {"text": "sáp nhập tỉnh 34 tỉnh", "comments": []},
            {"text": "hôm nay trời đẹp", "comments": []},
        ]
        result = filter_posts(posts)
        assert len(result) == 1
        assert "sáp nhập" in result[0]["text"]

    def test_filter_posts_removes_noise(self):
        from backend.legal_radar.crawlers.filter import filter_posts
        posts = [
            {"text": "bán vợt cầu lông", "comments": []},
            {"text": "mỹ phẩm lừa đảo", "comments": []},
        ]
        result = filter_posts(posts)
        assert len(result) == 0

    def test_filter_posts_checks_comments_too(self):
        from backend.legal_radar.crawlers.filter import filter_posts
        posts = [
            {
                "text": "Mọi người nghĩ sao?",
                "comments": [
                    {"text": "sắp xếp đơn vị hành chính giảm tỉnh 34 tỉnh"},
                ],
            },
        ]
        result = filter_posts(posts)
        assert len(result) == 1

    def test_is_relevant_case_insensitive(self):
        from backend.legal_radar.crawlers.filter import is_relevant
        assert is_relevant("SÁP NHẬP TỈNH 34 TỈNH") is True
