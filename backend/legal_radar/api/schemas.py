"""API request and response schemas."""

from pydantic import BaseModel

from ..model import ClaimLabel, SourceLabel


class QueueItemResponse(BaseModel):
    id: str
    claim: str
    label: ClaimLabel
    source_label: SourceLabel
    reason: str


class QuestionRequest(BaseModel):
    question: str

