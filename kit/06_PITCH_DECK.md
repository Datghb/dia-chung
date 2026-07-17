# 06 — Pitch Deck skeleton (12 slides) + Q&A bank

Build real slides only after Gate 3 (data exists). One idea per slide;
the demo moment appears by slide 4.

## The 12 slides

| # | Slide | Content rule |
|---|---|---|
| 1 | Title | Product name + one-sentence problem statement (from Decision Block) + team |
| 2 | Pain | Who hurts, when, what it costs — the organizers'/partner's own framing quoted back |
| 3 | Insight | The non-obvious fact you exploit (a stat, a decoupling, a gap) with citation |
| 4 | **Demo moment** | THE number/artifact from the real run — "we measured/did X last night" |
| 5 | Product | What it does in 3 bullets; live URL on screen |
| 6 | How it works | One architecture diagram; honesty metrics visible (CIs, error handling, traces) |
| 7 | AI-native build | Collab-log stats: N sessions, N commits, N tests, 100% generated in-window |
| 8 | Market | Bottom-up niche first ("small market is enough"), then the wave |
| 9 | Business model | Price ×2 tiers, margin, why they return (retention physics: {{NATURAL_FREQUENCY}}) |
| 10 | Moat | What compounds: data, longitudinal baselines, distribution, brand |
| 11 | Roadmap / "ends in a startup" | Pilot commitment ask; what exists beyond the hackathon (PRD, GTM docs) |
| 12 | Team + ask | Roles played; the specific ask (pilot, intro, prize) |

## Q&A bank by judge type (prep answers pre-event, refine at venue)

**Domain expert** — probes: is the pain real?
- Q: "Do {{SEGMENT}} actually have this problem?" → A: partner's own data +
  the live measurement from slide 4.
- Q: "How is this different from {{INCUMBENT}}?" → A: the insight (slide 3)
  incumbents structurally can't chase.

**Technical judge** — probes: is the AI integration honest?
- Q: "LLMs are non-deterministic — how do you trust the output?" → A: N-trial
  sampling / eval gate / CIs / traces (whichever the archetype uses). Never
  say "we prompt-engineered it well."
- Q: "What breaks under load / bad input?" → A: the failure story: fail-fast
  validation, retry policy, crash-safe persistence.
- Q: "Show me the tests." → A: open tests/ live; tests-first commits in the log.

**Non-technical judge** — probes: would a normal person get it?
- One-sentence explanation rehearsed in plain language + one analogy.
  ("llms.txt = a menu the AI can read" pattern — write yours: {{ANALOGY}}.)

**Senior judge / VC** — probes: startup potential.
- Q: "Why will this survive the next model release?" → A: the moat slide —
  data/relationships compound, models are the commodity.
- Q: "Who pays and how much?" → A: exact price, exact buyer, margin, first
  10 customers plan.
- Q: "You prepared too much?" → A: the ethics line from `01_COMPLIANCE.md`,
  verbatim, plus the live-regeneration offer.

## Delivery rules

- Rehearse ×2 full runs before submitting (schedule 80–90%).
- The pitcher never drives the live demo — a builder does, on a rehearsed script.
- Every number on a slide must exist in a run file or the collab log —
  judges cross-check.
