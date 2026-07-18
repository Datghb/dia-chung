from fastapi import APIRouter, HTTPException

from backend.legal_radar.api.data_access import get_queue_item
from backend.legal_radar.api.schemas import QueueItemResponse

router = APIRouter(tags=["cases"])


@router.get("/cases/{case_id}", response_model=QueueItemResponse)
def get_case(case_id: str) -> QueueItemResponse:
    item = get_queue_item(case_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return QueueItemResponse.model_validate(item)
