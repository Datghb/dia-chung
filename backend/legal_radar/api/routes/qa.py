from fastapi import APIRouter

from backend.legal_radar.pipeline import analyze_comment
from backend.legal_radar.api.schemas import QuestionRequest, QueueItemResponse

router = APIRouter(tags=["qa"])


@router.post("/qa", response_model=QueueItemResponse)
def ask_question(request: QuestionRequest) -> QueueItemResponse:
    return QueueItemResponse.model_validate(analyze_comment(request.question), from_attributes=True)

