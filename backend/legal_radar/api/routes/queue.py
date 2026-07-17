from fastapi import APIRouter

from ..schemas import QueueItemResponse

router = APIRouter(tags=["queue"])


@router.get("/queue", response_model=list[QueueItemResponse])
def list_queue() -> list[QueueItemResponse]:
    return []

