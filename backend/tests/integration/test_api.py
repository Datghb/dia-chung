from fastapi.testclient import TestClient

from legal_radar.api.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_queue_returns_fixture_backed_items() -> None:
    response = client.get("/api/queue")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 45
    assert {"id", "claim", "label", "source_label", "platform", "reach"} <= items[0].keys()


def test_case_returns_matching_queue_item() -> None:
    queue_items = client.get("/api/queue").json()
    assert queue_items
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

def test_crawl_returns_supported_schema(monkeypatch) -> None:
    from legal_radar.crawlers import scheduler

    def _fake_crawl_and_process(**_kwargs):
        return {"crawled": 0, "comments_found": 0, "processed": 0, "items": [], "error": "No items crawled"}

    monkeypatch.setattr(scheduler, "crawl_and_process", _fake_crawl_and_process)
    response = client.post("/api/crawl", json={"keywords": ["tin giả"], "max_posts_per_platform": 2})
    assert response.status_code == 200
    assert {"crawled", "comments_found", "processed", "error"} <= response.json().keys()
    assert response.json()["error"] == "No items crawled"
