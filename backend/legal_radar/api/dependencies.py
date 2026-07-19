"""Shared FastAPI dependencies."""

from hmac import compare_digest
from pathlib import Path

from fastapi import Header, HTTPException, status

from backend.legal_radar.paths import data_dir as project_data_dir
from backend.legal_radar.paths import repo_root as project_repo_root
from backend.legal_radar.paths import runs_dir as project_runs_dir
from backend.legal_radar.settings import get_settings


def repo_root() -> Path:
    return project_repo_root()


def runs_dir() -> Path:
    return project_runs_dir()


def data_dir() -> Path:
    return project_data_dir()


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    """Require an admin key for write and diagnostic operations."""
    settings = get_settings()
    configured_key = (settings.admin_api_key or "").strip()
    is_production = settings.app_env.lower() == "production"

    if not configured_key:
        if is_production:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Admin access is not configured",
            )
        return

    if not x_admin_key or not compare_digest(x_admin_key, configured_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin credentials required",
            headers={"WWW-Authenticate": "ApiKey"},
        )
