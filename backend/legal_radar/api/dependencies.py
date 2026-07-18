"""Shared FastAPI dependencies."""

from pathlib import Path

from backend.legal_radar.paths import data_dir as project_data_dir
from backend.legal_radar.paths import repo_root as project_repo_root
from backend.legal_radar.paths import runs_dir as project_runs_dir


def repo_root() -> Path:
    return project_repo_root()


def runs_dir() -> Path:
    return project_runs_dir()


def data_dir() -> Path:
    return project_data_dir()
