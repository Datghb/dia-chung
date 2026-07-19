# Spec: Production foundation 85 → 92

## Objective

Nâng Địa Chứng từ một tiến trình dùng JSONL/API key thành hệ thống có thể vận
hành nhiều người dùng: dữ liệu SQL có transaction và khóa phiên bản, phiên đăng
nhập HttpOnly với RBAC, telemetry có cấu trúc, resilience và quality gates.

## Architecture

- PostgreSQL là kho production; SQLite dùng cho integration tests.
- Khi `DATABASE_URL` trống, JSONL vẫn là adapter tương thích ngược và rollback.
- `ADMIN_API_KEY` bootstrap một phiên ký HMAC; khóa không lưu trong browser.
- Vai trò: `viewer` đọc, `reviewer` cập nhật/review, `admin` crawl/xóa/debug.
- SQL schema gồm `cases`, `reviews`, `audit_events`; audit chỉ append qua API.
- Mọi update case dùng `version` để phát hiện ghi đè đồng thời.

## Commands

```bash
backend/.venv/bin/ruff check backend
backend/.venv/bin/pytest backend/tests
backend/.venv/bin/python backend/eval/smoke.py
cd frontend && npm run typecheck && npm run lint && npm test && npm run test:e2e
docker compose -f deploy/compose.yaml config --quiet
```

## Testing strategy

- Unit: session signing, RBAC, optimistic locking, retry/circuit-breaker logic.
- Integration: SQL persistence, transaction rollback, API auth and audit.
- E2E: login → review → audit timeline, including expired/unauthorized session.
- Existing regression suites remain mandatory.

## Boundaries

- Always: validate at API boundary, parameterized SQL, append-only audit,
  request IDs, no PII/secrets in logs.
- Migration: SQL is opt-in until import and rollback verification pass.
- Never: expose admin key to frontend storage, silently overwrite a newer case,
  remove JSONL fallback in this release, or auto-deploy backend without
  production credentials.

## Success criteria

1. SQL review and audit commit atomically; stale versions return conflict.
2. Protected routes accept secure sessions and enforce roles.
3. Logs include request ID/event/latency without raw social content.
4. Readiness covers configured SQL; metrics expose bounded operational signals.
5. CI runs SQL integration, E2E auth/review, dependency and container scans.
6. Existing API consumers remain functional during the migration window.
