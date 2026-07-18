import json
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from legal_radar.model import NhanNguon
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

def test_crawl_returns_supported_schema(monkeypatch, tmp_path) -> None:
    from legal_radar.api.routes import crawl

    monkeypatch.setattr(crawl, "crawl_and_process", lambda **_: {"crawled": 0, "relevant": 0, "items": []})
    monkeypatch.setattr(crawl, "ingest_crawled_items", lambda _: [])
    monkeypatch.setattr(crawl, "runs_dir", lambda: tmp_path)
    response = client.post("/api/crawl", json={"keywords": ["tin giả"], "max_posts_per_platform": 2})
    assert response.status_code == 200
    assert {"collected", "added", "mode", "message", "analyzed", "queue_item_ids"} <= response.json().keys()
    assert response.json()["mode"] == "fallback"


def test_crawl_analyzes_fixture_posts_and_writes_queue(monkeypatch, tmp_path) -> None:
    from legal_radar import pipeline
    from legal_radar.api.routes import crawl

    fixture_path = (
        Path(__file__).resolve().parents[3]
        / "data"
        / "fixtures"
        / "crawled_sample.json"
    )
    fixture_post = json.loads(fixture_path.read_text(encoding="utf-8"))[0]
    expected_count = 1 + len(fixture_post.get("comments", []))
    queue_path = tmp_path / "queue.jsonl"
    provider = MagicMock()
    provider.generate.return_value = json.dumps(
        {
            "claim": "Thông tin sáp nhập cần kiểm chứng",
            "keywords": ["sáp nhập", "đơn vị hành chính"],
            "subject": None,
        },
        ensure_ascii=False,
    )

    monkeypatch.setattr(
        crawl,
        "crawl_and_process",
        lambda **_: {"crawled": 1, "relevant": 1, "items": [fixture_post]},
    )
    monkeypatch.setattr(crawl, "runs_dir", lambda: tmp_path)
    monkeypatch.setattr(pipeline, "_queue_path", lambda: queue_path)
    monkeypatch.setattr(pipeline, "_default_provider", lambda: provider)

    with patch(
        "legal_radar.source_search.dynamic_search_gemini",
        return_value=[],
    ), patch(
        "legal_radar.pipeline.xac_thuc_nguon",
        return_value=(NhanNguon.CHUA_TIM_THAY_NGUON, [], "Không tìm thấy nguồn"),
    ):
        response = client.post(
            "/api/crawl",
            json={"keywords": ["sáp nhập"], "max_posts_per_platform": 1},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["analyzed"] == expected_count
    assert len(body["queue_item_ids"]) == expected_count
    rows = [
        json.loads(line)
        for line in queue_path.read_text(encoding="utf-8").splitlines()
    ]
    assert len(rows) == expected_count
    assert [row["id"] for row in rows] == body["queue_item_ids"]
