from fastapi import APIRouter

from ..data_access import list_queue_items
from ..schemas import QueueItemResponse

router = APIRouter(tags=["queue"])


@router.get("/queue", response_model=list[QueueItemResponse])
def list_queue() -> list[QueueItemResponse]:
    return [QueueItemResponse.model_validate(item) for item in list_queue_items()]
