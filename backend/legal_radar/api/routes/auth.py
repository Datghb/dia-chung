"""Operator session lifecycle."""

from hmac import compare_digest
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from pydantic import BaseModel, Field

from backend.legal_radar.api.dependencies import SESSION_COOKIE, get_principal
from backend.legal_radar.auth import Principal, SessionManager
from backend.legal_radar.settings import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


class SessionRequest(BaseModel):
    actor: str = Field(default="operator", min_length=1, max_length=100)
    role: Literal["reviewer", "admin"] = "reviewer"


class SessionResponse(BaseModel):
    subject: str
    role: str
    csrf_token: str
    expires_at: int


def _response(principal: Principal) -> SessionResponse:
    return SessionResponse(
        subject=principal.subject,
        role=principal.role,
        csrf_token=principal.csrf_token,
        expires_at=principal.expires_at,
    )


@router.post("/session", response_model=SessionResponse)
def create_session(
    body: SessionRequest,
    response: Response,
    x_admin_key: str | None = Header(default=None),
) -> SessionResponse:
    settings = get_settings()
    configured_key = (settings.admin_api_key or "").strip()
    if not configured_key:
        if settings.app_env.lower() == "production":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Admin access is not configured",
            )
        configured_key = "development-only-session-secret"
    elif not x_admin_key or not compare_digest(x_admin_key, configured_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bootstrap credential",
        )

    token, principal = SessionManager(
        configured_key,
        ttl_seconds=settings.session_ttl_seconds,
    ).issue(body.actor, body.role)
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=settings.app_env.lower() == "production",
        samesite="strict",
        path="/api",
    )
    response.headers["Cache-Control"] = "no-store"
    return _response(principal)


@router.get("/me", response_model=SessionResponse)
def current_session(principal: Principal = Depends(get_principal)) -> SessionResponse:
    return _response(principal)


@router.delete("/session", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/api", samesite="strict")
    response.headers["Cache-Control"] = "no-store"
