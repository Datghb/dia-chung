from backend.legal_radar.observability import MetricsRegistry


def test_metrics_are_bounded_by_route_template() -> None:
    metrics = MetricsRegistry()
    metrics.observe("GET", "/api/cases/{case_id}", 200, 0.012)
    metrics.observe("GET", "/api/cases/{case_id}", 404, 0.008)

    snapshot = metrics.snapshot()

    assert snapshot["requests_total"] == 2
    assert snapshot["errors_total"] == 1
    assert len(snapshot["routes"]) == 2
    assert snapshot["routes"][0]["route"] == "/api/cases/{case_id}"
    assert {row["latency_ms_avg"] for row in snapshot["routes"]} == {8.0, 12.0}
