from fastapi import APIRouter

from backend.legal_radar.api.data_access import list_study_cases

router = APIRouter(tags=["verification"])


@router.get("/verify")
def verification_summary() -> dict[str, list[object]]:
    return {"cases": list_study_cases()}
