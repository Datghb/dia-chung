"""Shared FastAPI dependencies."""

from __future__ import annotations

from collections.abc import Callable
from hmac import compare_digest
from pathlib import Path
from time import time

from fastapi import Header, HTTPException, Request, status

from backend.legal_radar.auth import InvalidSessionError, Principal, SessionManager
from backend.legal_radar.paths import data_dir as project_data_dir
from backend.legal_radar.paths import repo_root as project_repo_root
from backend.legal_radar.paths import runs_dir as project_runs_dir
from backend.legal_radar.settings import get_settings

SESSION_COOKIE = "legal_radar_session"


def repo_root() -> Path:
    """Return the repository root path."""
    return project_repo_root()


def runs_dir() -> Path:
    """Return the runtime runs directory path."""
    return project_runs_dir()


def data_dir() -> Path:
    """Return the data directory path."""
    return project_data_dir()


def _credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Operator session required",
        headers={"WWW-Authenticate": "Session"},
    )


def get_principal(
    request: Request,
    x_admin_key: str | None = Header(default=None),
) -> Principal:
    """Resolve a signed session, with a temporary API-key compatibility path."""
    settings = get_settings()
    configured_key = (settings.admin_api_key or "").strip()
    is_production = settings.app_env.lower() == "production"

    if not configured_key:
        if is_production:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Admin access is not configured",
            )
        return Principal("development", "admin", "", int(time()) + 3600)

    if x_admin_key and compare_digest(x_admin_key, configured_key):
        return Principal("legacy-admin-key", "admin", "", int(time()) + 300)

    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise _credentials_error()
    try:
        return SessionManager(
            configured_key,
            ttl_seconds=settings.session_ttl_seconds,
        ).verify(token)
    except InvalidSessionError as error:
        raise _credentials_error() from error


def require_roles(*allowed_roles: str) -> Callable[..., Principal]:
    """Create a role and CSRF enforcing dependency."""

    def dependency(
        request: Request,
        x_admin_key: str | None = Header(default=None),
        x_csrf_token: str | None = Header(default=None),
    ) -> Principal:
        principal = get_principal(request, x_admin_key)
        if principal.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role",
            )
        if (
            request.method not in {"GET", "HEAD", "OPTIONS"}
            and principal.csrf_token
            and (not x_csrf_token or not compare_digest(x_csrf_token, principal.csrf_token))
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid CSRF token",
            )
        return principal

    return dependency


require_reviewer = require_roles("reviewer", "admin")
require_admin = require_roles("admin")
