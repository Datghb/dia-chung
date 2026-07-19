"""Authenticated operational diagnostics."""

from fastapi import APIRouter, Depends

from backend.legal_radar.api.dependencies import require_admin
from backend.legal_radar.observability import metrics

router = APIRouter(tags=["operations"])


@router.get("/metrics", dependencies=[Depends(require_admin)])
def get_metrics() -> dict[str, object]:
    return metrics.snapshot()
