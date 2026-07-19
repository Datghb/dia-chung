import pytest

from backend.legal_radar.storage import CaseVersionConflict, SqlStore


def test_sql_store_persists_cases_and_reviews_atomically(tmp_path) -> None:
    store = SqlStore(f"sqlite:///{tmp_path / 'legal-radar.db'}")
    store.initialize()
    store.upsert_case(
        {
            "id": "case-1",
            "claim": "Claim cần kiểm chứng",
            "nhan": "can_kiem_chung",
            "nhan_nguon": "chua_tim_thay_nguon",
            "status": "new",
        }
    )

    reviewed = store.review_case(
        "case-1",
        expected_version=1,
        decision="corrected",
        note="Nguồn không hỗ trợ nhãn cũ",
        corrected_label="hieu_lam",
        actor="reviewer-1",
    )

    assert reviewed["status"] == "resolved"
    assert reviewed["nhan"] == "hieu_lam"
    assert reviewed["version"] == 2
    audit = store.list_audit("case-1")
    assert audit[-1]["action"] == "ai_reviewed"
    assert audit[-1]["actor"] == "reviewer-1"


def test_sql_store_rejects_stale_case_version(tmp_path) -> None:
    store = SqlStore(f"sqlite:///{tmp_path / 'legal-radar.db'}")
    store.initialize()
    store.upsert_case({"id": "case-1", "claim": "Claim", "status": "new"})
    store.review_case(
        "case-1",
        expected_version=1,
        decision="accepted",
        note="",
        corrected_label=None,
        actor="reviewer-1",
    )

    with pytest.raises(CaseVersionConflict):
        store.review_case(
            "case-1",
            expected_version=1,
            decision="rejected",
            note="Đã có người cập nhật",
            corrected_label=None,
            actor="reviewer-2",
        )

    assert len(store.list_audit("case-1")) == 1


def test_stale_status_update_does_not_append_audit(tmp_path) -> None:
    store = SqlStore(f"sqlite:///{tmp_path / 'status.db'}")
    store.initialize()
    store.upsert_case({"id": "case-status", "status": "new"})
    store.update_case_status(
        "case-status",
        status="reviewing",
        expected_version=1,
        actor="reviewer-a",
    )

    with pytest.raises(CaseVersionConflict):
        store.update_case_status(
            "case-status",
            status="resolved",
            expected_version=1,
            actor="reviewer-b",
        )

    assert len(store.list_audit("case-status")) == 1
