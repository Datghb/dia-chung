# Operations runbook

## Signals

- `/health`: process liveness.
- `/ready`: required files, writable runtime storage, and configured SQL
  connectivity.
- `/api/metrics`: admin-only request/error counts and bounded latency summaries.
- Every response has `X-Request-ID`; JSON request logs contain the same ID,
  route template, status, and latency. Logs intentionally exclude claims,
  comments, credentials, and CSRF tokens.

Alert when readiness fails for two consecutive checks, the 5xx ratio exceeds 2%
for five minutes, or average review-route latency exceeds 1 second. A burst of
401/403/429 responses should trigger credential and abuse review.

## Incident response

1. Record the request ID, UTC time, route, deployment commit, and affected case
   ID. Never copy raw credentials into the incident record.
2. Check `/ready`, then PostgreSQL health and free disk space.
3. For provider failures, allow the circuit breaker to cool down for 30 seconds;
   do not create an unbounded retry loop.
4. For HTTP 409, reload the current case and reapply the human decision instead
   of bypassing version checks.
5. Rotate `ADMIN_API_KEY` if exposure is suspected. Existing signed sessions
   become invalid immediately.

## Rollback and recovery

Before rollout, retain `runs/queue.jsonl` and take a PostgreSQL backup. To roll
back the data adapter, remove `DATABASE_URL` and redeploy the last verified
commit; the import script never modifies JSONL. Do not delete PostgreSQL or
audit volumes. Restore SQL only into a separate database first, run `/ready`,
compare case/audit counts, and then switch `DATABASE_URL`.
