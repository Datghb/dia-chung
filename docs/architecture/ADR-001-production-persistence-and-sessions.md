# ADR-001: SQL persistence and signed operator sessions

Status: Accepted — 2026-07-19

## Context

JSONL and a static API key cannot safely support concurrent reviewers. A failed
write can separate a review from its audit event, and two reviewers can silently
overwrite each other.

## Decision

- PostgreSQL is the production source of truth; SQLite exercises the same
  repository in integration tests.
- Every case carries a monotonic `version`. Mutations include the version read by
  the reviewer and return HTTP 409 on conflict.
- Review, case update, and audit append occur in one database transaction.
- `ADMIN_API_KEY` bootstraps an eight-hour, HMAC-signed HttpOnly cookie. Mutations
  from a cookie session require a separate CSRF token.
- Reviewer and administrator permissions are distinct. The direct API-key path
  remains temporarily available for migration automation.

## Consequences

Production requires PostgreSQL and a strong `ADMIN_API_KEY`. The JSONL adapter
remains available by removing `DATABASE_URL`, so rollback does not require a
destructive reverse migration. Process-local metrics and rate limits reset when
a replica restarts; centralized telemetry is a later scaling step.
