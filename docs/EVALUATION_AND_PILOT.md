# Evaluation and pilot plan

## Current reproducible gates

Run from the repository root:

```bash
backend/.venv/bin/ruff check backend
backend/.venv/bin/pytest backend/tests
backend/.venv/bin/python backend/eval/smoke.py
cd frontend && npm run typecheck && npm run lint && npm test
```

Current local baseline: 348 backend tests passed, four live-provider tests skipped when credentials are unavailable, and all 14 business smoke cases passed. The frontend passes type checking, linting, production build, and three server-render tests.

The 14-case smoke set is a regression gate, not evidence of production accuracy. Before procurement or enforcement use, create a versioned, independently labelled gold set with at least two legal reviewers and adjudication for disagreements. Report precision, recall, macro-F1, citation-support rate, false-positive rate, and calibration by topic and source tier.

## Four-week pilot

1. Week 1: shadow mode only; collect representative content, record reviewer agreement, and validate retention/access controls.
2. Week 2: review every AI result; tune thresholds using the frozen gold set, never on the test split.
3. Week 3: allow prioritization assistance while keeping all legal conclusions human-approved.
4. Week 4: assess KPIs, operational cost, failure modes, and rollback readiness.

Promotion criteria: zero unauthorized administrative writes, 100% traceable human decisions, citation-support rate at least 95% for definitive labels, false-positive rate below the threshold agreed by legal owners, and documented incident/rollback drills. The system must not autonomously issue penalties.

## Audit and rollback

Each human decision is appended to `runs/audit.jsonl` with an analysis version. Keep immutable deployment identifiers with evaluation results. Roll back by deploying the previous tested version and disabling crawl/write access through the gateway while preserving audit records.
