from fastapi import APIRouter

router = APIRouter(tags=["verification"])


@router.get("/verify")
def verification_summary() -> dict[str, list[object]]:
    return {"cases": []}

