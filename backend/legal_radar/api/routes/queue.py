from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from backend.legal_radar.api.data_access import (
    get_audit_log,
    list_queue_items,
    review_queue_item,
    update_queue_item_review,
    update_queue_item_status,
)
from backend.legal_radar.api.dependencies import require_admin
from backend.legal_radar.api.schemas import (
    AuditEntryResponse,
    QueueItemResponse,
    ReviewRequest as LegacyReviewRequest,
)
from backend.legal_radar.guardrails import validate_reviewer_label

router = APIRouter(tags=["queue"])


class StatusUpdate(BaseModel):
    status: str
    reviewer_label: str = Field(default="")
    reviewer_reason: str = Field(default="")
    reviewer_note: str = Field(default="")


class DecisionReviewRequest(BaseModel):
    decision: Literal["accepted", "corrected", "rejected"]
    note: str = Field(default="", max_length=1000)
    corrected_label: Literal["dung", "hieu_lam", "can_kiem_chung"] | None = None


@router.get("/queue", response_model=list[QueueItemResponse])
def list_queue(response: Response) -> list[QueueItemResponse]:
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    return [QueueItemResponse.model_validate(item) for item in list_queue_items()]


@router.patch(
    "/cases/{case_id}/status",
    response_model=QueueItemResponse,
    dependencies=[Depends(require_admin)],
)
def update_case_status(case_id: str, body: StatusUpdate) -> QueueItemResponse:
    allowed = {"new", "reviewing", "resolved"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status phải là một trong: {allowed}")
    if body.reviewer_label:
        try:
            validate_reviewer_label(body.reviewer_label)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
    effective_status = (
        "resolved" if body.reviewer_label and body.status != "resolved" else body.status
    )
    item = update_queue_item_status(
        case_id,
        effective_status,
        reviewer_label=body.reviewer_label,
        reviewer_reason=body.reviewer_reason,
        reviewer_note=body.reviewer_note,
    )
    if item is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} không tồn tại")
    return QueueItemResponse.model_validate(item)


@router.post(
    "/cases/{case_id}/review",
    response_model=QueueItemResponse,
    dependencies=[Depends(require_admin)],
)
def record_review_decision(
    case_id: str,
    body: DecisionReviewRequest,
) -> QueueItemResponse:
    if body.decision == "corrected" and body.corrected_label is None:
        raise HTTPException(
            status_code=400,
            detail="corrected_label là bắt buộc khi decision là corrected",
        )
    if body.decision in {"corrected", "rejected"} and not body.note.strip():
        raise HTTPException(
            status_code=400,
            detail="note là bắt buộc khi sửa hoặc bác bỏ kết quả AI",
        )
    item = review_queue_item(
        case_id,
        body.decision,
        body.note,
        body.corrected_label,
    )
    if item is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} không tồn tại")
    return QueueItemResponse.model_validate(item)


@router.patch(
    "/cases/{case_id}/review",
    response_model=QueueItemResponse,
    dependencies=[Depends(require_admin)],
)
def update_legacy_review(
    case_id: str,
    body: LegacyReviewRequest,
) -> QueueItemResponse:
    allowed_actions = {"approve", "reject", "escalate"}
    if body.action and body.action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Action phải là một trong: {allowed_actions}",
        )
    allowed_labels = {"dung", "hieu_lam", "can_kiem_chung"}
    if body.human_label and body.human_label not in allowed_labels:
        raise HTTPException(
            status_code=400,
            detail=f"Label phải là một trong: {allowed_labels}",
        )
    allowed_sources = {
        "co_nguon_xac_nhan",
        "co_bac_bo_chinh_thuc",
        "chua_tim_thay_nguon",
    }
    if body.human_source_label and body.human_source_label not in allowed_sources:
        raise HTTPException(
            status_code=400,
            detail=f"Source label phải là một trong: {allowed_sources}",
        )
    item = update_queue_item_review(
        case_id,
        human_label=body.human_label,
        human_source_label=body.human_source_label,
        reviewer_notes=body.reviewer_notes,
        action=body.action,
    )
    if item is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} không tồn tại")
    return QueueItemResponse.model_validate(item)


@router.get(
    "/cases/{case_id}/audit",
    response_model=list[AuditEntryResponse],
    dependencies=[Depends(require_admin)],
)
def get_case_audit(case_id: str) -> list[AuditEntryResponse]:
    return [AuditEntryResponse.model_validate(entry) for entry in get_audit_log(case_id)]


@router.delete("/queue", dependencies=[Depends(require_admin)])
def clear_queue() -> dict[str, object]:
    from backend.legal_radar.api.dependencies import runs_dir

    queue_path = runs_dir() / "queue.jsonl"
    deleted = 0
    if queue_path.exists():
        from backend.legal_radar.api.data_access import _queue_from_jsonl

        deleted = len(_queue_from_jsonl(queue_path))
        queue_path.unlink()
    return {"deleted": deleted, "message": f"Đã xóa {deleted} hồ sơ khỏi hàng đợi."}
