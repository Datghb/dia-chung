"""Transactional SQL persistence used when DATABASE_URL is configured."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    delete,
    insert,
    select,
    update,
)
from sqlalchemy.engine import Engine


class CaseVersionConflict(RuntimeError):
    """The case changed after the reviewer loaded it."""


metadata = MetaData()

cases = Table(
    "cases",
    metadata,
    Column("id", String(128), primary_key=True),
    Column("status", String(32), nullable=False, default="new", index=True),
    Column("version", Integer, nullable=False, default=1),
    Column("payload", JSON, nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

reviews = Table(
    "reviews",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("case_id", String(128), nullable=False, index=True),
    Column("decision", String(32), nullable=False),
    Column("corrected_label", String(32)),
    Column("note", Text, nullable=False, default=""),
    Column("actor", String(128), nullable=False),
    Column("case_version", Integer, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

audit_events = Table(
    "audit_events",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("case_id", String(128), nullable=False, index=True),
    Column("action", String(64), nullable=False),
    Column("actor", String(128), nullable=False),
    Column("old_value", Text, nullable=False, default=""),
    Column("new_value", Text, nullable=False, default=""),
    Column("note", Text, nullable=False, default=""),
    Column("created_at", DateTime(timezone=True), nullable=False),
)


class SqlStore:
    def __init__(self, database_url: str) -> None:
        connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
        self.engine: Engine = create_engine(
            database_url,
            pool_pre_ping=True,
            connect_args=connect_args,
        )

    def initialize(self) -> None:
        metadata.create_all(self.engine)

    def ping(self) -> None:
        with self.engine.connect() as connection:
            connection.execute(select(1))

    def upsert_case(self, raw: dict[str, Any]) -> dict[str, Any]:
        case_id = str(raw.get("id", "")).strip()
        if not case_id:
            raise ValueError("Case id is required")
        now = datetime.now(UTC)
        payload = dict(raw)
        status_value = str(payload.get("status", "new"))
        with self.engine.begin() as connection:
            existing = connection.execute(
                select(cases.c.version).where(cases.c.id == case_id)
            ).first()
            if existing is None:
                version = 1
                connection.execute(
                    insert(cases).values(
                        id=case_id,
                        status=status_value,
                        version=version,
                        payload=payload,
                        updated_at=now,
                    )
                )
            else:
                version = int(existing.version) + 1
                connection.execute(
                    update(cases)
                    .where(cases.c.id == case_id)
                    .values(
                        status=status_value,
                        version=version,
                        payload=payload,
                        updated_at=now,
                    )
                )
        return {**payload, "version": version}

    def list_cases(self) -> list[dict[str, Any]]:
        with self.engine.connect() as connection:
            rows = connection.execute(select(cases).order_by(cases.c.updated_at.desc())).all()
        return [
            {
                **dict(row.payload),
                "status": row.status,
                "version": row.version,
            }
            for row in rows
        ]

    def review_case(
        self,
        case_id: str,
        *,
        expected_version: int,
        decision: str,
        note: str,
        corrected_label: str | None,
        actor: str,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        with self.engine.begin() as connection:
            row = connection.execute(select(cases).where(cases.c.id == case_id)).first()
            if row is None:
                raise KeyError(case_id)
            if int(row.version) != expected_version:
                raise CaseVersionConflict(case_id)

            old_payload = dict(row.payload)
            new_payload = dict(old_payload)
            new_payload["status"] = "resolved"
            if corrected_label:
                new_payload["nhan"] = corrected_label
            new_version = expected_version + 1
            updated = connection.execute(
                update(cases)
                .where(cases.c.id == case_id, cases.c.version == expected_version)
                .values(
                    status="resolved",
                    version=new_version,
                    payload=new_payload,
                    updated_at=now,
                )
            )
            if updated.rowcount != 1:
                raise CaseVersionConflict(case_id)

            connection.execute(
                insert(reviews).values(
                    case_id=case_id,
                    decision=decision,
                    corrected_label=corrected_label,
                    note=note,
                    actor=actor,
                    case_version=new_version,
                    created_at=now,
                )
            )
            connection.execute(
                insert(audit_events).values(
                    case_id=case_id,
                    action="ai_reviewed",
                    actor=actor,
                    old_value=str(old_payload.get("nhan", "")),
                    new_value=corrected_label or str(old_payload.get("nhan", "")),
                    note=note,
                    created_at=now,
                )
            )
        return {**new_payload, "version": new_version}

    def update_case_status(
        self,
        case_id: str,
        *,
        status: str,
        expected_version: int | None,
        actor: str,
        reviewer_label: str = "",
        reviewer_reason: str = "",
        reviewer_note: str = "",
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        with self.engine.begin() as connection:
            row = connection.execute(select(cases).where(cases.c.id == case_id)).first()
            if row is None:
                raise KeyError(case_id)
            if expected_version is not None and int(row.version) != expected_version:
                raise CaseVersionConflict(case_id)
            payload = dict(row.payload)
            old_status = str(row.status)
            if reviewer_label:
                payload["reviewer_label"] = reviewer_label
            if reviewer_reason:
                payload["reviewer_reason"] = reviewer_reason
            if reviewer_note:
                payload["reviewer_note"] = reviewer_note
            payload["status"] = status
            new_version = int(row.version) + 1
            updated = connection.execute(
                update(cases)
                .where(cases.c.id == case_id, cases.c.version == row.version)
                .values(
                    status=status,
                    version=new_version,
                    payload=payload,
                    updated_at=now,
                )
            )
            if updated.rowcount != 1:
                raise CaseVersionConflict(case_id)
            connection.execute(
                insert(audit_events).values(
                    case_id=case_id,
                    action="status_change",
                    actor=actor,
                    old_value=old_status,
                    new_value=status,
                    note=reviewer_note or reviewer_reason,
                    created_at=now,
                )
            )
        return {**payload, "version": new_version}

    def list_audit(self, case_id: str) -> list[dict[str, Any]]:
        with self.engine.connect() as connection:
            rows = connection.execute(
                select(audit_events)
                .where(audit_events.c.case_id == case_id)
                .order_by(audit_events.c.id)
            ).all()
        return [
            {
                "case_id": row.case_id,
                "action": row.action,
                "actor": row.actor,
                "old_value": row.old_value,
                "new_value": row.new_value,
                "note": row.note,
                "timestamp": row.created_at.isoformat(),
            }
            for row in rows
        ]

    def clear_cases(self) -> int:
        with self.engine.begin() as connection:
            result = connection.execute(delete(cases))
        return int(result.rowcount or 0)

    def import_jsonl(self, path: Path) -> int:
        imported = 0
        if not path.exists():
            return imported
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                self.upsert_case(json.loads(line))
                imported += 1
            except (json.JSONDecodeError, ValueError):
                continue
        return imported
