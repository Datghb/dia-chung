"""Shared FastAPI dependencies."""

from pathlib import Path


def runs_dir() -> Path:
    return Path(__file__).resolve().parents[3] / "runs"

