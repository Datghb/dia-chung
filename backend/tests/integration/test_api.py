import json
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from backend.legal_radar.api.main import app
from backend.legal_radar.model import NhanNguon

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_checks_required_data_and_runtime_storage() -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_api_responses_include_security_headers() -> None:
    response = client.get("/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["content-security-policy"].startswith("default-src")
    assert response.headers["x-request-id"]


def test_cors_preflight_allows_production_frontend() -> None:
    response = client.options(
        "/api/crawl",
        headers={
            "Origin": "https://diachung.dpdns.org",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://diachung.dpdns.org"


def test_cors_preflight_allows_local_frontend() -> None:
    response = client.options(
        "/api/crawl",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_queue_returns_list_with_supported_schema() -> None:
    response = client.get("/api/queue")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    if items:
        assert {"id", "claim", "label", "source_label", "platform", "reach"} <= items[0].keys()


def test_case_returns_matching_queue_item() -> None:
    queue_items = client.get("/api/queue").json()
    if not queue_items:
        return
    queue_item = queue_items[0]
    response = client.get(f"/api/cases/{queue_item['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == queue_item["id"]


def test_case_missing_returns_404() -> None:
    response = client.get("/api/cases/not-found")
    assert response.status_code == 404


def test_verify_returns_study_cases() -> None:
    response = client.get("/api/verify")
    assert response.status_code == 200
    cases = response.json()["cases"]
    assert len(cases) >= 2
    assert {"id", "ten_vu", "expected_he_thong", "nguon_url"} <= cases[0].keys()


def test_qa_returns_supported_schema() -> None:
    response = client.post("/api/qa", json={"question": "Cá nhân đăng tin giả bị phạt bao nhiêu?"})
    assert response.status_code == 200
    assert response.json()["label"] in {"dung", "hieu_lam", "can_kiem_chung"}


def test_qa_rejects_oversized_input() -> None:
    response = client.post("/api/qa", json={"question": "a" * 5001})
    assert response.status_code == 422


def test_debug_route_does_not_expose_api_key_prefix(monkeypatch) -> None:
    import backend.legal_radar.settings as settings_mod
    from backend.legal_radar.api.routes import crawl

    fake = settings_mod.Settings(
        APP_ENV="development",
        BRIGHTDATA_API_KEY="secret-key-that-must-not-leak",
    )
    monkeypatch.setattr(crawl, "get_settings", lambda: fake, raising=False)

    response = client.get("/api/crawl/debug")

    assert "api_key_prefix" not in response.text


def test_admin_write_route_rejects_missing_key(monkeypatch) -> None:
    import backend.legal_radar.settings as settings_mod
    from backend.legal_radar.api import dependencies

    fake = settings_mod.Settings(
        APP_ENV="production",
        ADMIN_API_KEY="test-admin-key",
    )
    monkeypatch.setattr(dependencies, "get_settings", lambda: fake)

    response = client.patch(
        "/api/cases/not-found/status",
        json={"status": "reviewing"},
    )

    assert response.status_code == 401


def test_admin_write_route_accepts_valid_key(monkeypatch) -> None:
    import backend.legal_radar.settings as settings_mod
    from backend.legal_radar.api import dependencies

    fake = settings_mod.Settings(
        APP_ENV="production",
        ADMIN_API_KEY="test-admin-key",
    )
    monkeypatch.setattr(dependencies, "get_settings", lambda: fake)

    response = client.patch(
        "/api/cases/not-found/status",
        json={"status": "reviewing"},
        headers={"X-Admin-Key": "test-admin-key"},
    )

    assert response.status_code == 404


def test_production_write_route_fails_closed_without_config(monkeypatch) -> None:
    import backend.legal_radar.settings as settings_mod
    from backend.legal_radar.api import dependencies

    fake = settings_mod.Settings(APP_ENV="production", ADMIN_API_KEY="")
    monkeypatch.setattr(dependencies, "get_settings", lambda: fake)

    response = client.patch(
        "/api/cases/not-found/status",
        json={"status": "reviewing"},
    )

    assert response.status_code == 503


def test_reviewer_session_requires_csrf_and_cannot_clear_queue(monkeypatch) -> None:
    import backend.legal_radar.settings as settings_mod
    from backend.legal_radar.api import dependencies
    from backend.legal_radar.api.routes import auth

    fake = settings_mod.Settings(
        APP_ENV="production",
        ADMIN_API_KEY="test-admin-key",
    )
    monkeypatch.setattr(dependencies, "get_settings", lambda: fake)
    monkeypatch.setattr(auth, "get_settings", lambda: fake)

    with TestClient(app, base_url="https://testserver") as session_client:
        login = session_client.post(
            "/api/auth/session",
            headers={"X-Admin-Key": "test-admin-key"},
            json={"actor": "reviewer-1", "role": "reviewer"},
        )
        assert login.status_code == 200
        assert "httponly" in login.headers["set-cookie"].lower()
        assert "secure" in login.headers["set-cookie"].lower()
        csrf_token = login.json()["csrf_token"]

        missing_csrf = session_client.patch(
            "/api/cases/not-found/status",
            json={"status": "reviewing"},
        )
        accepted_csrf = session_client.patch(
            "/api/cases/not-found/status",
            headers={"X-CSRF-Token": csrf_token},
            json={"status": "reviewing"},
        )
        forbidden_admin_action = session_client.delete(
            "/api/queue",
            headers={"X-CSRF-Token": csrf_token},
        )

    assert missing_csrf.status_code == 403
    assert accepted_csrf.status_code == 404
    assert forbidden_admin_action.status_code == 403


def test_reviewer_can_reject_result_and_create_audit_event(
    monkeypatch,
    tmp_path,
) -> None:
    from backend.legal_radar.api import data_access

    queue_item = {
        "id": "review-me",
        "comment_id": "review-me",
        "text": "Nội dung thử nghiệm",
        "claim": "Claim thử nghiệm",
        "keywords": [],
        "nhan": "can_kiem_chung",
        "ly_do": "Thiếu bằng chứng",
        "nhan_nguon": "chua_tim_thay_nguon",
    }
    (tmp_path / "queue.jsonl").write_text(
        json.dumps(queue_item, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(data_access, "runs_dir", lambda: tmp_path)

    response = client.post(
        "/api/cases/review-me/review",
        json={
            "decision": "rejected",
            "note": "Citation không hỗ trợ kết luận",
            "corrected_label": "can_kiem_chung",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "resolved"
    audit_rows = [json.loads(line) for line in (tmp_path / "audit.jsonl").read_text(encoding="utf-8").splitlines()]
    assert audit_rows[-1]["event"] == "ai_reviewed"
    assert audit_rows[-1]["decision"] == "rejected"
    assert audit_rows[-1]["case_id"] == "review-me"


def test_reviewer_must_explain_correction_or_rejection(monkeypatch, tmp_path) -> None:
    from backend.legal_radar.api import data_access

    (tmp_path / "queue.jsonl").write_text(
        json.dumps(
            {
                "id": "needs-reason",
                "claim": "Claim thử nghiệm",
                "nhan": "can_kiem_chung",
                "nhan_nguon": "chua_tim_thay_nguon",
            },
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(data_access, "runs_dir", lambda: tmp_path)

    response = client.post(
        "/api/cases/needs-reason/review",
        json={"decision": "rejected", "note": ""},
    )

    assert response.status_code == 400
    assert not (tmp_path / "audit.jsonl").exists()


def test_sql_review_is_transactional_and_rejects_stale_version(
    monkeypatch,
    tmp_path,
) -> None:
    import backend.legal_radar.settings as settings_mod
    from backend.legal_radar.api import data_access

    fake = settings_mod.Settings(
        APP_ENV="development",
        DATABASE_URL=f"sqlite:///{tmp_path / 'api.db'}",
    )
    monkeypatch.setattr(data_access, "get_settings", lambda: fake)
    data_access._store_for_url.cache_clear()
    store = data_access._sql_store()
    assert store is not None
    store.upsert_case(
        {
            "id": "sql-review",
            "claim": "Claim SQL",
            "nhan": "can_kiem_chung",
            "nhan_nguon": "chua_tim_thay_nguon",
            "status": "new",
        }
    )

    accepted = client.post(
        "/api/cases/sql-review/review",
        json={
            "decision": "accepted",
            "note": "",
            "expected_version": 1,
        },
    )
    stale = client.post(
        "/api/cases/sql-review/review",
        json={
            "decision": "rejected",
            "note": "Dữ liệu cũ",
            "expected_version": 1,
        },
    )

    assert accepted.status_code == 200
    assert accepted.json()["version"] == 2
    assert stale.status_code == 409
    assert len(store.list_audit("sql-review")) == 1


def test_crawl_returns_supported_schema(monkeypatch, tmp_path) -> None:
    from backend.legal_radar.api.routes import crawl

    monkeypatch.setattr(crawl, "runs_dir", lambda: tmp_path)
    monkeypatch.setattr(
        crawl, "_try_live_crawl", lambda *a, **kw: ({"items": [], "crawled": 0, "relevant": 0}, "Test: no items")
    )
    import backend.legal_radar.settings as settings_mod

    fake = settings_mod.Settings(BRIGHTDATA_API_KEY="test-key")
    monkeypatch.setattr(settings_mod, "get_settings", lambda: fake)
    with patch("backend.legal_radar.source_search.search_brightdata", return_value=[]):
        response = client.post("/api/crawl", json={"keywords": ["tin giả"], "max_posts_per_platform": 2})
    assert response.status_code == 200
    lines = [ln for ln in response.text.strip().split("\n") if ln.strip()]
    assert len(lines) >= 1
    start_msg = json.loads(lines[0])
    assert start_msg["type"] == "error"


def test_crawl_analyzes_fixture_posts_and_writes_queue(monkeypatch, tmp_path) -> None:
    from backend.legal_radar.api.routes import crawl

    fixture_path = Path(__file__).resolve().parents[3] / "data" / "fixtures" / "crawled_sample.json"
    fixture_post = json.loads(fixture_path.read_text(encoding="utf-8"))[0]
    expected_count = 1
    queue_path = tmp_path / "queue.jsonl"
    provider = MagicMock()
    provider.generate.return_value = json.dumps(
        {
            "claim": "Thong tin sap nhap can kiem chung",
            "keywords": ["sap nhap", "don vi hanh chinh"],
            "subject": None,
        },
        ensure_ascii=False,
    )

    monkeypatch.setattr(
        crawl,
        "_try_live_crawl",
        lambda *a, **kw: ({"crawled": 1, "relevant": 1, "items": [fixture_post]}, None),
    )
    monkeypatch.setattr(crawl, "runs_dir", lambda: tmp_path)

    import backend.legal_radar.settings as settings_mod

    fake = settings_mod.Settings(BRIGHTDATA_API_KEY="test-key")
    monkeypatch.setattr(settings_mod, "get_settings", lambda: fake)

    import backend.legal_radar.pipeline as pipeline_mod

    monkeypatch.setattr(pipeline_mod, "_queue_path", lambda: queue_path)
    monkeypatch.setattr(crawl, "_queue_path", lambda: queue_path)
    monkeypatch.setattr(
        crawl, "_build_crawled_ingestor", lambda qp: pipeline_mod.CommentIngestor(provider, MagicMock(), str(qp))
    )
    monkeypatch.setattr(pipeline_mod, "_default_provider", lambda: provider)

    official_url = "https://chinhphu.vn/thong-tin-chinh-thuc"
    with (
        patch(
            "backend.legal_radar.source_search.search_brightdata",
            return_value=[
                {
                    "tieu_de": "Thông tin chính thức",
                    "nguon": "Cổng TTĐT Chính phủ",
                    "url": official_url,
                    "ngay_dang": "2026-07-16",
                    "noi_dung_tom_tat": "Thông tin đối chiếu",
                    "la_bac_bo": False,
                    "la_xac_nhan": True,
                }
            ],
        ),
        patch(
            "backend.legal_radar.pipeline.xac_thuc_nguon",
            return_value=(
                NhanNguon.CO_NGUON_XAC_NHAN,
                [
                    {
                        "tieu_de": "Thông tin chính thức",
                        "nguon": "Cổng TTĐT Chính phủ",
                        "url": official_url,
                    }
                ],
                "Có nguồn xác nhận",
            ),
        ),
    ):
        response = client.post(
            "/api/crawl",
            json={"keywords": ["sap nhap"], "max_posts_per_platform": 1},
        )

    assert response.status_code == 200
    lines = [ln for ln in response.text.strip().split("\n") if ln.strip()]
    types = [json.loads(ln)["type"] for ln in lines]
    assert "start" in types
    assert "done" in types
    done_msg = json.loads(lines[-1])
    assert done_msg["analyzed"] == expected_count

    rows = [json.loads(line) for line in queue_path.read_text(encoding="utf-8").splitlines()]
    assert len(rows) == expected_count
    assert all(row["source_url"] == official_url for row in rows)
    assert all(row["url"] == fixture_post["url"] for row in rows)
    item_messages = [json.loads(line) for line in lines if json.loads(line)["type"] == "item"]
    assert all(message["source_url"] == official_url for message in item_messages)
