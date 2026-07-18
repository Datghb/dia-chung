"""Shared FastAPI dependencies."""

from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def runs_dir() -> Path:
    return repo_root() / "runs"


def data_dir() -> Path:
    return repo_root() / "data"
