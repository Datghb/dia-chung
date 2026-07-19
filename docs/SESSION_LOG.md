# Session Log — Địa Chứng (Legal-Radar) Hackathon
# 2026-07-17 → 2026-07-19

---

## Project: AI_HACKATHON (C:\AI_HACKATHON)
Repository: https://github.com/Datghb/Parasitic-
Product: Địa Chứng — Legal document verification system for administrative merger rumors

### Day 1 — July 17, 2026

#### 00:00–04:00 — Foundation
- Initialized hackathon kit with AIZ Legal-KG concept (Điều 95 NĐ174/2026 vs Điều 101 NĐ15/2020)
- Created 5-person team plan: Team A (accuracy) + Team B (infra)
- Set up RAG2 dual-layer architecture: static corpus + dynamic Gemini search for source verification
- Added frontend/backend project architecture docs

#### 04:00–08:00 — Data & Pipeline (P2)
- Built Knowledge Graph: 34 nodes, 18 edges covering NĐ174/2026 and NĐ15/2020
- Implemented `phan_loai_claim()` — rule-based classification engine
- Created `_classify_ca_nhan()` / `_classify_to_chuc()` — amount-based fraud detection
- Built `tich_hop_nguon()` — source label integration into pipeline
- Added 45 comments fixture data, facts corpus, study cases
- Wrote 102 unit tests (ALL PASS)

#### 08:00–12:00 — Frontend Dashboard (B2)
- Built social monitoring dashboard with queue view
- Added case detail panel with verdict display
- Implemented sidebar navigation, platform icons (Facebook/TikTok/YouTube)
- Styled with soft floating dashboard theme

#### 12:00–16:00 — Crawlers (A2/P3)
- Implemented Facebook crawler with Playwright + Bright Data API
- Added Vietnamese keyword filtering, headless mode, parallel processing
- Built scheduler with dedup, clean, filter pipeline
- Wired crawl pipeline into CommentIngestor → queue.jsonl

#### 16:00–20:00 — Integration (P4)
- Connected crawl → engine → queue → dashboard end-to-end
- Added manual content intake flow (`/api/qa`)
- Fixed CORS, CORS middleware, KG data path for Docker
- Added URL links, source verification, penalty display to queue

#### 20:00–00:00 — Polish & Deploy
- Renamed product to "Địa Chứng"
- Added Dockerfile, docker-compose, health checks
- Set up CI/CD pipeline
- Fixed 11 bugs across UI, engine logic, source verification

### Day 2 — July 18, 2026

#### 00:00–04:00 — Bug Fixes & Optimization
- Fixed source label, diacritics matching, dedup in crawl_and_process
- Used Discover metadata as fallback when scraper fails
- Added multi-source crawlers and synced monitoring UI
- Fixed Bright Data API issues (timeout, poll iterations, thread timeout)

#### 04:00–08:00 — Dashboard Enhancement
- Built strategic market analytics dashboard
- Bound analytics to queue data
- Added authentic social platform logos
- Fixed queue checkbox column stretching

#### 08:00–12:00 — Source Verification (P2.7)
- Integrated `tich_hop_nguon()` into `pipeline.process_one()`
- Optimized crawler — Vietnamese keywords, headless, parallel, fast scroll
- Built hybrid crawler — Playwright search + Bright Data API extract
- Added batch2 diversity for study cases

#### 12:00–16:00 — Testing & CI
- Updated tests + scheduler for Bright Data API crawler
- Fixed CI test failures — monkeypatch crawl_and_process
- Added business evaluation gate and smoke test functionality
- Enhanced repo_root function for Docker environment

#### 16:00–20:00 — Production Hardening
- Improved deployment script for environment variable handling
- Updated NEXT_PUBLIC_API_URL handling in deployment scripts
- Added runs directory setup in Dockerfile
- Added CORS middleware, resolve KG data path for Docker

#### 20:00–00:00 — Final Polish
- Fixed display bugs: risk index → discussion trends
- Validated source URLs, added facts corpus fallback
- Removed deprecated files, cleaned up unused code
- Enabled source search in all pipeline entry points
- Fixed CORS PATCH, dedup queue, status persist, API integration

### Day 3 — July 19, 2026

#### 00:00–04:00 — Deployment & Monitoring
- Added Caddy reverse proxy
- Fixed CD pipeline
- Added rate limiting for expensive analysis requests
- Enforced production quality gates

#### 04:00–08:00 — Final Fixes
- Removed simulated frontend analysis results
- Secured administrative review workflow
- Required direct evidence before legal classification
- Pre-filtered Discover results by metadata before scraping
- Enhanced layout for system expectations display

---

## Project: PARASITIC-MAIN (C:\Parasitic-main)
Repository: https://github.com/Datghb/dia-chung
Branch: logic (production clone of AI_HACKATHON)

### Day 3 — July 19, 2026 (Kilo sessions)

#### 02:00–03:00 — HITL Flow Design
- Session: `ses_089622665ffeQO9oeQysSEiRPy` — Explore HITL-relevant code
- Mapped full pipeline flow: crawl → LLM extract → classify → queue → dashboard
- Identified all automated decision points
- Found no existing human review mechanisms

#### 03:00–04:00 — HITL Recommendation
- Session: `ses_089629eb8ffeDDWto02QT6iYqQ` — Human-in-the-loop flow recommendation
- Designed 5-phase HITL plan: auto-routing → label override → review queue → audit trail → feedback loop
- Recommended PATCH /api/cases/{id}/review endpoint
- Proposed confidence-based auto-routing: <50 → pending_review, ≥70+confirmed → auto_approved

#### 06:00–07:00 — Logic Branch Analysis
- Session: `ses_08878cef8ffeNuOJHFC0YTdTnu` — Explore logic branch code
- Analyzed latest code from logic branch
- Mapped QueueItem schema, all API routes, frontend components
- Identified missing HITL mechanisms

#### 06:20–07:00 — Metric Deep Dive
- Session: `ses_08874157bffeeYvQRHH51KjnL5` — Explore score/confidence/risk UI
- Traced MỨC RỦI RO: priority int (0-3) + reach threshold
- Traced ĐÁNH GIÁ AI: label-based DUNG=15, CAN_KIEM_CHUNG=50, HIEU_LAM=80
- Traced ĐỘ TIN CẬY: base 50/75/80 + flat +15 source bonus, cap 95

#### 07:00–08:00 — Metric Rework Plan
- Designed 3 new signal-driven metrics:
  - MỨC RỦI RO: severity + reach (log scale) + CTA + source gap
  - ĐÁNH GIÁ AI: BM25 + amount match + subject + citations + study case
  - ĐỘ TIN CẬY: tier + count + recency + denial + citations
- Critical review: identified BM25 score not available to pipeline, CTA hidden, source recency not computed
- Revised plan: full engine changes to expose intermediate signals

#### 08:00–09:00 — Engine Refactoring
- Added `PhanLoaiResult` dataclass for richer classification output
- Modified `match_hanh_vi()` → `match_hanh_vi_with_scores()` returning BM25 scores
- Modified `_classify_ca_nhan()` / `_classify_to_chuc()` to return amount match type
- Modified `tich_hop_nguon()` to return CTA flag as 3rd element
- Updated `classify_claim_full()` to populate new ClassificationResult fields

#### 09:00–10:00 — Pipeline & Frontend Updates
- Added `_compute_risk()`, `_compute_accuracy()`, `_compute_reliability()` functions
- Updated `process_one()` to capture new signals and compute new metrics
- Added `spread_risk`, `ai_accuracy`, `source_reliability` to QueueItem model
- Updated API schemas, data_access, contracts
- Updated frontend types, api.ts mapping, queue-view, case-detail

#### 10:00–11:00 — Testing & Bug Fixes
- Fixed test failures for PhanLoaiResult return type
- Fixed tich_hop_nguon 3-tuple unpacking in tests
- Ran full test suite: 320 tests pass
- Committed and pushed to logic branch

#### 11:00–12:00 — PR & Merge
- Created PR #8: rework dashboard metrics with signal-driven scoring
- Merged main into logic (no conflicts)
- Created PR #9: fallback metrics for legacy queue data
- Backfilled old queue.jsonl with computed metrics

#### 12:00–13:00 — Source Reliability Fix
- Identified source_reliability showing 15% for all items
- Root cause: _compute_reliability received matched_docs=[] from fallback source
- Root cause: count_sc fixed at 5 with 1 source (system returns max 1 source)
- Rebalanced formula: removed count, increased tier/denial weights
- Fallback: denial=90, confirmed+citations=70, confirmed=55

#### 13:00–14:00 — Accuracy Fix & HITL
- Fixed AI accuracy too low (28/100 for CAN_KIEM_CHUNG)
- Raised base from 10 to 25, improved BM25 scaling
- Added HITL review endpoint: PATCH /api/cases/{id}/review
- Actions: approve, reject (override label), escalate
- Frontend: approve/escalate buttons in case detail footer

#### 14:00–15:00 — Final Sync
- Merged main into logic (13 new commits, no conflicts)
- Created PR #10: source reliability rebalance
- Created PR #11: AI accuracy + HITL review
- All PRs merged to main
- Logic branch synced with main

---

## Commit Summary (July 17–19)

### AI_HACKATHON (Parasitic-)
Total commits: ~120

Key commits by category:

**Engine (P2)**
- `f4b1d2b` chore: baseline commit of local A1/A2 work
- `a01e789` Implement B1 pipeline in refactored layout
- `33d64ad` feat(B1): P2.7 integrate tich_hop_nguon into pipeline.process_one
- `66925fd` feat(A1): P2.7 integration — tich_hop_nguon() merges nhan_nguon into ly_do
- `094bc7e` feat: comment guardrail - classify each comment, filter flagged only

**Crawlers (A2/P3/P4)**
- `f27582e` feat(A2): facebook crawler — search phrase, extract post+comments
- `5565dae` feat(A2): hybrid crawler — Playwright search + Bright Data API extract
- `25f185b` feat(P3): domain-specific crawler + clean + filter + P4 sync
- `4e4b8ab` feat(P4): wire crawl pipeline into CommentIngestor
- `6b33c77` feat(P4): crawl route, pipeline integration, dedup fixes

**Data (P2)**
- `d6cdad9` Complete all B1 data: 45 comments, full KG, facts corpus, study cases
- `917a5cd` feat(P2): domain data for administrative merger rumor monitoring
- `7c8f6b4` fix(P2): address review gaps — verify log, precise study case

**Frontend (B2)**
- `166bdac` feat: build social monitoring dashboard
- `7ab88f4` feat: complete B2 dashboard data integration
- `410314d` feat: add strategic market analytics dashboard
- `c7b8ac7` Add multi-source crawlers and synced monitoring UI

**Deploy**
- `43c8e58` feat: add Dockerfile and docker-compose updates
- `0d94adf` fix: improve deployment script
- `7a106e0` add caddy

### PARASITIC-MAIN (logic branch)
Total commits: ~15

- `d45044f` feat: rework dashboard metrics with signal-driven scoring
- `964a439` fix: compute fallback metrics for legacy queue data
- `97955d6` fix: backfill old queue data with computed metrics
- `928d99a` fix: rebalance source_reliability for single-source reality
- `f343089` feat: fix AI accuracy floor + HITL review endpoint

PRs: #8, #9, #10, #11 — all merged to main

---

## File Change Summary

### Backend
| File | Changes |
|------|---------|
| `engine.py` | +129 lines: PhanLoaiResult, match_hanh_vi_with_scores, amount match type, CTA flag |
| `pipeline.py` | +99 lines: _compute_risk, _compute_accuracy, _compute_reliability |
| `model.py` | +5 lines: spread_risk, ai_accuracy, source_reliability fields |
| `data_access.py` | +70 lines: fallback metrics, review persistence |
| `schemas.py` | +10 lines: ReviewRequest, human_label/notes fields |
| `queue.py` | +25 lines: PATCH /cases/{id}/review endpoint |

### Frontend
| File | Changes |
|------|---------|
| `types/index.ts` | +9 lines: spreadRisk, aiAccuracy, sourceReliability, humanLabel |
| `utils/api.ts` | +20 lines: reviewCase(), map new fields |
| `queue-view.tsx` | +28 lines: spread risk badge, AI accuracy, source reliability ring |
| `case-detail.tsx` | +35 lines: 3 progress bars, approve/escalate buttons |

### Tests
| File | Changes |
|------|---------|
| `test_engine.py` | Updated for PhanLoaiResult, tich_hop_nguon 3-tuple |

### Docs
| File | Changes |
|------|---------|
| `docs/METRICS.md` | New: 166 lines documenting all 3 metric formulas |

---

## Key Decisions

1. **Signal-driven scoring** — replaced hardcoded values with engine-exposed signals (BM25, amount match, CTA, study case)
2. **Single-source reality** — removed count signal from reliability, increased tier/denial weights
3. **Accuracy floor** — raised base from 10→25 so CAN_KIEM_CHUNG doesn't look like AI failure
4. **HITL review** — approve/reject/escalate actions with human label override
5. **Backward compatibility** — old score/confidence fields retained alongside new metrics

---

## Environment Notes

- Python 3.11 (Windows Store)
- Node.js (frontend)
- uvicorn --reload for backend hot reload
- Port 8000 stuck (ghost process), used 8001/8002 instead
- BrightData API key required for source verification (TOKENROUTER_API_KEY missing in some runs)
- queue.jsonl is gitignored — backfilled data is local only
