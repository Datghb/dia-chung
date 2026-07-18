from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from backend.legal_radar.api.data_access import list_queue_items, update_queue_item_status
from backend.legal_radar.api.schemas import QueueItemResponse

router = APIRouter(tags=["queue"])


class StatusUpdate(BaseModel):
    status: str


@router.get("/queue", response_model=list[QueueItemResponse])
def list_queue(response: Response) -> list[QueueItemResponse]:
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    return [QueueItemResponse.model_validate(item) for item in list_queue_items()]


@router.patch("/cases/{case_id}/status", response_model=QueueItemResponse)
def update_case_status(case_id: str, body: StatusUpdate) -> QueueItemResponse:
    allowed = {"new", "reviewing", "resolved"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status phải là một trong: {allowed}")
    item = update_queue_item_status(case_id, body.status)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} không tồn tại")
    return QueueItemResponse.model_validate(item)


@router.delete("/queue")
def clear_queue() -> dict[str, object]:
    from backend.legal_radar.api.dependencies import runs_dir
    queue_path = runs_dir() / "queue.jsonl"
    deleted = 0
    if queue_path.exists():
        from backend.legal_radar.api.data_access import _queue_from_jsonl
        deleted = len(_queue_from_jsonl(queue_path))
        queue_path.unlink()
    return {"deleted": deleted, "message": f"Đã xóa {deleted} hồ sơ khỏi hàng đợi."}
