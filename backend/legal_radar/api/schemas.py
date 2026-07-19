"""API request and response schemas."""

from pydantic import BaseModel, Field

from backend.legal_radar.model import ClaimLabel, SourceLabel


class QueueItemResponse(BaseModel):
    id: str
    comment_id: str = ""
    text: str = ""
    url: str = ""
    claim: str
    keywords: list[str] = Field(default_factory=list)
    citations: list[str] = Field(default_factory=list)
    label: ClaimLabel
    source_label: SourceLabel
    reason: str
    priority: int = 0
    platform: str = "Forum"
    account: str = "Nguồn chưa xác định"
    published_at: str = ""
    created_at: str = ""
    reach: int = 0
    status: str = "new"
    document: str = "Nghị định 174/2026/NĐ-CP"
    provision: str = ""
    penalty: str = ""
    subject: str = "Chưa xác định"
    source_title: str = ""
    source_url: str = ""
    source_agency: str = ""
    score: int = 50
    confidence: int = 50
    spread_risk: int = 0
    ai_accuracy: int = 0
    source_reliability: int = 0
    human_label: str = ""
    human_source_label: str = ""
    reviewer_notes: str = ""
    comments: list[dict] = Field(default_factory=list)
    reviewer_label: str = ""
    reviewer_reason: str = ""
    reviewer_note: str = ""
    reviewed_at: str = ""


class AuditEntryResponse(BaseModel):
    case_id: str
    action: str
    actor: str = "operator"
    old_value: str = ""
    new_value: str = ""
    note: str = ""
    timestamp: str = ""


class ReviewRequest(BaseModel):
    human_label: str | None = None
    human_source_label: str | None = None
    reviewer_notes: str | None = None
    action: str | None = None


class QuestionRequest(BaseModel):
    question: str

class CrawlRequest(BaseModel):
    keywords: list[str] = Field(default_factory=list)
    max_posts_per_platform: int = Field(default=10, ge=1, le=50)

class CrawlResponse(BaseModel):
    collected: int
    added: int
    mode: str
    message: str
    analyzed: int
    queue_item_ids: list[str] = Field(default_factory=list)
