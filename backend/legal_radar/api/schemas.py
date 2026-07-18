"""API request and response schemas."""

from pydantic import BaseModel, Field

from ..model import ClaimLabel, SourceLabel


class QueueItemResponse(BaseModel):
    id: str
    comment_id: str = ""
    text: str = ""
    claim: str
    keywords: list[str] = Field(default_factory=list)
    label: ClaimLabel
    source_label: SourceLabel
    reason: str
    priority: int = 0
    platform: str = "Forum"
    account: str = "Nguồn chưa xác định"
    published_at: str = ""
    reach: int = 0
    status: str = "new"


class QuestionRequest(BaseModel):
    question: str
