from backend.legal_radar.api.main import app


def test_required_paths_exist() -> None:
    paths = app.openapi()["paths"]
    assert {"/health", "/api/queue", "/api/cases/{case_id}", "/api/verify", "/api/qa", "/api/crawl"} <= paths.keys()
