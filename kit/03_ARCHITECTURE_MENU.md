# 03 — Architecture Menu: pre-decided stacks per archetype

Decisions made calmly before the event so nobody debates libraries at 2 AM.
**Decision tables only — no code.** The AI instantiates the chosen archetype
in BOOTSTRAP Phase B.

## Cross-cutting defaults (all archetypes)

| Concern | Default | Notes |
|---|---|---|
| Language | Python 3.11+, type hints on all signatures | pytest; frozen dataclasses; pure functions for core math (no I/O) |
| LLM providers | Gemini (`gemini-3.1-flash-lite`, free tier ×2 keys) · Groq (`llama-4-scout`, free 30K TPM) · OpenRouter (`deepseek-v4-flash`, paid fallback) | Thin self-written provider layer (P3) — never a heavy framework |
| Persistence | JSONL append + flush for anything sampled/streamed (crash-safe); SQLite if relational | Never lose data to a crash at hour 40 |
| Secrets | `.env` + python-dotenv, gitignored | Validate at startup, fail fast |
| API surface | FastAPI (if REST) and/or FastMCP (if agent-consumable is part of the story) | MCP tool = strong "AI-native" judge signal |
| Web/demo UI | Server-rendered single page or static HTML report; Streamlit only if UI IS the product | No SPA builds in a 48 h window |
| Deploy | Railway / Render / Fly (pre-tested account) · fallback: ngrok from laptop · last resort: pre-rendered static HTML | Deploy a hello-world at H0 to verify the pipe |
| Evals | Every LLM feature gets a smoke-eval (5–10 cases) before demo | Judges probe non-determinism handling |

## A — RAG / knowledge app

*Fits:* "answer questions over the partner's documents/data", search,
compliance lookup, internal knowledge.

| Decision | Choice |
|---|---|
| Core modules (P-map) | P1 ingest/chunker → P2 retrieval + answer composer (pure, testable ranking math) → P4 pipeline → P5 report/CLI → P6 API/UI |
| Chunking | 200–800 tokens, heading-aware; store source refs per chunk |
| Store | Start BM25/keyword (zero infra) → add embeddings (Gemini embedding API) only if retrieval quality demands it |
| Invariant core | retrieval scoring + citation-grounded answer composition |
| Pivot surface | the corpus + the question set |
| Demo pattern | live question from the judges' domain, answer with visible source citations |
| Known traps | ingestion eats the whole schedule (timebox to one format); hallucination in demo (always show sources) |

## B — Agent / workflow automation

*Fits:* "AI agent that revolutionizes operation X", multi-step tasks, tool
use, "automate this workflow for SMEs".

| Decision | Choice |
|---|---|
| Core modules | P1 task/state model → P2 planner-executor loop (pure state transitions, testable without LLM) → P3 providers + tools → P4 run loop w/ JSONL trace → P6 surface |
| Loop design | explicit state machine, max-iterations cap, every step traced |
| Tools | 3–5 max, each a thin function with schema; mock-tested |
| Invariant core | the plan→act→observe loop + trace format |
| Pivot surface | the tool set + system prompt for the domain |
| Demo pattern | one end-to-end task run live with the trace visible ("watch it think") |
| Known traps | unbounded loops in demo (cap + timeout); flaky tool #4 (cut to 3) |

## C — Measurement / scoring engine

*Fits:* "audit/score/benchmark X", visibility, quality, compliance ratings.
(This is the AgentAttract shape — see the VAIC package for a full instance.)

| Decision | Choice |
|---|---|
| Core modules | P1 panel/spec loader → P2 scoring math (pure; bootstrap CI if sampling LLMs) → P4 multi-engine sampler → P5 report + digest → P6 MCP/API → P8 fix/recommendation layer |
| Statistics | N-trial sampling, seeded bootstrap 95% CI, stability coefficient — never single-shot numbers |
| Caching | NEVER cache measurement-path LLM calls (variance is the signal) |
| Invariant core | scoring formulas + report schema |
| Pivot surface | the prompt panel / rubric for the partner's category |
| Demo pattern | "we measured your industry last night" — a real baseline number with CI |
| Known traps | quota exhaustion mid-run (key rotation + quota budget table); overnight run fails silently (crash-safe JSONL + resume) |

## D — LLM API service / integration layer

*Fits:* "expose capability X as a service", middleware, routing, enrichment
APIs for the partner's stack.

| Decision | Choice |
|---|---|
| Core modules | P1 request/response models → P2 core transform logic (pure) → P3 providers w/ fallback chain → P5 usage/cost report → P6 FastAPI + OpenAPI docs |
| Reliability story | timeout + retry + fallback chain + rate limit — judges love an honest failure story |
| Invariant core | the transform + envelope schema (success/data/error/meta) |
| Pivot surface | the domain transform + partner data mapping |
| Demo pattern | live curl/Postman + the auto-generated API docs page |
| Known traps | building auth (skip it — API key header is enough); gold-plating the envelope |

## E — AI UI / copilot

*Fits:* "assistant for role X", chat over workflow, guided experience where
the interface IS the value.

| Decision | Choice |
|---|---|
| Core modules | P1 session/message model → P2 conversation state + guardrails (pure) → P3 providers streaming → P6 UI (Streamlit or single HTML+SSE page) → P5 transcript export |
| Streaming | token streaming from minute one — perceived speed is the demo |
| Invariant core | conversation state machine + safety rails |
| Pivot surface | the persona/system prompt + domain widgets |
| Demo pattern | scripted 90-second conversation that hits the pain point beat by beat |
| Known traps | CSS at 3 AM (use library defaults); demo goes off-script (rehearse the exact conversation, pin temperature) |

## Budget table (fill pre-event)

| Provider | Key(s) | Free quota | Paid ceiling | Owner |
|---|---|---|---|---|
| Gemini (`gemini-3.1-flash-lite`) | 2 keys | 500 RPD/key | — | {{TODO-EVENT: tên}} |
| Groq (`llama-4-scout`) | 2 keys | 30K TPM | — | {{TODO-EVENT: tên}} |
| OpenRouter (`deepseek-v4-flash`, paid fallback) | 1 | — | $5 | {{TODO-EVENT: tên}} |

---

# INSTANTIATION NOTE — AIZ Legal-KG: archetype A primary + hybrid E

Chốt tại pre-event (Decision Block draft trong `02_PROBLEM_INTAKE.md`):

| Decision | Choice cho bài này |
|---|---|
| Core modules (P-map) | P1 KG model/loader → P2 engine (match + phạt theo chủ thể + diff + phân loại nhãn) → P3 providers → P4 ingest văn bản (1 lần, freeze) + batch comments → P5 report → **P6 dashboard 3 màn** → P9 rails |
| Store | JSON files cho KG (nodes/edges — KHÔNG cần Neo4j, ~vài chục node); BM25/keyword matching thuần cho retrieval; JSONL cho queue. Embeddings chỉ thêm nếu matching keyword không đủ (khó xảy ra với scope 2 điều) |
| LLM dùng ở đâu | CHỈ 2 chỗ: (1) trích xuất văn bản → KG lúc ingest (chạy 1 lần, human verify, freeze); (2) trích claim/keywords/chủ thể từ comment ở P4. Engine P2 thuần rule/keyword — deterministic, test được |
| UI | Server-rendered (FastAPI + Jinja2), dashboard cán bộ — UI là mặt tiền nhưng KHÔNG SPA, không chatbot |
| Demo pattern | mở item trong hàng đợi → hồ sơ đối tượng (nhãn hiểu lầm + rule 1/2 + diff) → tab kiểm chứng tái lập vụ xử phạt thật |
| Known traps | ingest ăn hết schedule → chỉ parse 3 điều đã trích sẵn trong `data/nd174_trich.md`, không parse cả 117 điều; hallucination → mọi kết luận đi qua engine + citation bắt buộc |
