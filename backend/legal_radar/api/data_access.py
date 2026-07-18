"""Read-only data access for dashboard API routes."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ..pipeline import analyze_comment
from .dependencies import data_dir, runs_dir


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def _queue_from_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not path.exists():
        return rows
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def _fixture_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for path in sorted((data_dir() / "fixtures").glob("comments_batch_*.json")):
        rows.extend(_read_json(path))
    return rows


def _platform(source: str) -> str:
    source = source.lower()
    if "fanpage" in source or "group" in source:
        return "Facebook"
    if "video" in source:
        return "YouTube"
    return "Forum"


def _normalise(raw: dict[str, Any], fixture: dict[str, Any] | None = None) -> dict[str, Any]:
    fixture = fixture or {}
    label = raw.get("nhan") or raw.get("label") or "can_kiem_chung"
    source_label = raw.get("nhan_nguon") or raw.get("source_label") or "chua_tim_thay_nguon"
    return {
        "id": str(raw.get("id") or fixture.get("id")),
        "comment_id": str(raw.get("comment_id") or fixture.get("id", "")),
        "text": str(raw.get("text") or fixture.get("text", "")),
        "claim": str(raw.get("claim") or raw.get("text") or fixture.get("text", "")),
        "keywords": list(raw.get("keywords") or []),
        "label": getattr(label, "value", label),
        "source_label": getattr(source_label, "value", source_label),
        "reason": str(raw.get("ly_do") or raw.get("reason") or "Cần cán bộ đối chiếu."),
        "priority": int(raw.get("priority", 0)),
        "platform": _platform(str(fixture.get("nguon_mo_ta", "forum"))),
        "account": str(fixture.get("nguon_mo_ta", "Nguồn chưa xác định")),
        "published_at": str(fixture.get("thoi_gian", "")),
        "reach": int(fixture.get("do_lan_truyen", raw.get("reach", 0)) or 0),
        "status": "new",
    }


def list_queue_items() -> list[dict[str, Any]]:
    fixtures = _fixture_rows()
    fixture_by_id = {str(item["id"]): item for item in fixtures}
    raw_rows = _queue_from_jsonl(runs_dir() / "queue.jsonl")
    if raw_rows:
        items = [_normalise(row, fixture_by_id.get(str(row.get("id")))) for row in raw_rows]
    else:
        items = []
        for fixture in fixtures:
            analysed = analyze_comment(str(fixture["text"]))
            analysed["id"] = fixture["id"]
            items.append(_normalise(analysed, fixture))
    return sorted(items, key=lambda row: (row["priority"], row["reach"]), reverse=True)


def get_queue_item(case_id: str) -> dict[str, Any] | None:
    return next((item for item in list_queue_items() if item["id"] == case_id), None)


def list_study_cases() -> list[dict[str, Any]]:
    path = data_dir() / "study_cases" / "study_cases.json"
    return _read_json(path) if path.exists() else []
