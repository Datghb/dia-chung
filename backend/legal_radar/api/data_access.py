"""Read-only data access for dashboard API routes."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from backend.legal_radar.api.dependencies import data_dir, runs_dir


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


def _compute_spread_risk_fallback(label: str, reach: int, source_label: str, reason: str) -> int:
    severity = 40 if label == "hieu_lam" else 20 if label == "can_kiem_chung" else 5
    reach_sc = min(30, round(math.log2(reach + 1) * 5)) if reach > 0 else 0
    has_cta = any(w in reason.lower() for w in ["tẩy chay", "cảnh giác", "cảnh báo", "đừng tin", "báo cáo", "chia sẻ ngay"])
    cta = 15 if has_cta and source_label == "chua_tim_thay_nguon" else 5 if has_cta else 0
    source_gap = 10 if source_label == "chua_tim_thay_nguon" else 5 if source_label == "co_bac_bo_chinh_thuc" else 0
    return min(100, severity + reach_sc + cta + source_gap)


def _compute_ai_accuracy_fallback(score: int, confidence: int, label: str, citations: list) -> int:
    cite_sc = min(15, len(citations) * 5)
    if label == "dung":
        return min(100, 60 + cite_sc)
    elif label == "hieu_lam":
        return min(100, 55 + cite_sc)
    else:
        return min(100, 30 + cite_sc)


def _compute_source_reliability_fallback(source_label: str, citations: list) -> int:
    denial_sc = 20 if source_label == "co_bac_bo_chinh_thuc" else 10 if source_label == "co_nguon_xac_nhan" else 0
    cite_sc = 5 if citations else 0
    return min(100, denial_sc + cite_sc)


def _normalise(raw: dict[str, Any]) -> dict[str, Any]:
    label = raw.get("nhan") or raw.get("label") or "can_kiem_chung"
    source_label = raw.get("nhan_nguon") or raw.get("source_label") or "chua_tim_thay_nguon"
    label_val = getattr(label, "value", label)
    source_val = getattr(source_label, "value", source_label)
    priority = int(raw.get("priority", 0))
    reach = int(raw.get("reach", 0) or 0)

    source_title = str(raw.get("source_title", ""))
    source_url = str(raw.get("source_url", ""))
    source_agency = str(raw.get("source_agency", ""))
    if not source_title:
        source_title = "Chưa tìm thấy nguồn phù hợp"
        if source_val == "co_nguon_xac_nhan":
            source_title = "Có nguồn chính thức xác nhận"
        elif source_val == "co_bac_bo_chinh_thuc":
            source_title = "Có nguồn chính thức bác bỏ"

    score = min(95, 30 + priority * 20 + min(25, reach // 10))
    if label_val == "hieu_lam":
        score = max(score, 60)

    platform = str(raw.get("platform", "Forum"))
    account = str(raw.get("account", ""))
    reason = str(raw.get("ly_do") or raw.get("reason") or "")
    citations = list(raw.get("citations") or [])

    spread_risk = int(raw.get("spread_risk", 0))
    ai_accuracy = int(raw.get("ai_accuracy", 0))
    source_reliability = int(raw.get("source_reliability", 0))

    if not spread_risk:
        spread_risk = _compute_spread_risk_fallback(label_val, reach, source_val, reason)
    if not ai_accuracy:
        ai_accuracy = _compute_ai_accuracy_fallback(
            int(raw.get("score", score)), int(raw.get("confidence", 50)), label_val, citations,
        )
    if not source_reliability:
        source_reliability = _compute_source_reliability_fallback(source_val, citations)

    return {
        "id": str(raw.get("id", "")),
        "comment_id": str(raw.get("comment_id", "")),
        "text": str(raw.get("text", "")),
        "url": str(raw.get("url", "")),
        "claim": str(raw.get("claim") or raw.get("text", "")),
        "keywords": list(raw.get("keywords") or []),
        "label": label_val,
        "source_label": source_val,
        "reason": reason,
        "priority": priority,
        "platform": platform,
        "account": account,
        "published_at": str(raw.get("published_at", "")),
        "reach": reach,
        "status": str(raw.get("status", "new")),
        "document": str(raw.get("document", "Nghị định 174/2026/NĐ-CP")),
        "provision": str(raw.get("provision", "")),
        "penalty": str(raw.get("penalty", "")),
        "subject": str(raw.get("subject", "Chưa xác định")),
        "source_title": source_title,
        "source_url": source_url,
        "source_agency": source_agency,
        "score": int(raw.get("score", score)),
        "confidence": int(raw.get("confidence", 50)),
        "spread_risk": spread_risk,
        "ai_accuracy": ai_accuracy,
        "source_reliability": source_reliability,
        "comments": list(raw.get("comments") or []),
    }


def list_queue_items() -> list[dict[str, Any]]:
    raw_rows = _queue_from_jsonl(runs_dir() / "queue.jsonl")
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for row in raw_rows:
        item = _normalise(row)
        if item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)
    return sorted(unique, key=lambda row: (row["priority"], row["reach"]), reverse=True)


def get_queue_item(case_id: str) -> dict[str, Any] | None:
    return next((item for item in list_queue_items() if item["id"] == case_id), None)


def update_queue_item_status(case_id: str, new_status: str) -> dict[str, Any] | None:
    queue_path = runs_dir() / "queue.jsonl"
    if not queue_path.exists():
        return None
    rows = _queue_from_jsonl(queue_path)
    updated = None
    for row in rows:
        if str(row.get("id", "")) == case_id:
            row["status"] = new_status
            updated = _normalise(row)
            break
    if updated is None:
        return None
    with queue_path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return updated


def list_study_cases() -> list[dict[str, Any]]:
    path = data_dir() / "study_cases" / "study_cases.json"
    return _read_json(path) if path.exists() else []
