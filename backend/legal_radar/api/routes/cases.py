from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["cases"])


@router.get("/cases/{case_id}")
def get_case(case_id: str) -> dict[str, str]:
    raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

