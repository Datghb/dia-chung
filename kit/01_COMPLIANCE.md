# 01 — Compliance: the toolchain-vs-product boundary

Fill this against the event's actual published rules **before the event**.
Quote the rules verbatim — you will need the exact wording when challenged.

## The event's rules (fill in)

| Item | Verbatim quote from rules |
|---|---|
| Code rule | {{TODO-EVENT: quote nguyên văn thể lệ AIZ về code — điền TRƯỚC event}} |
| Allowed prep | {{TODO-EVENT: quote nguyên văn phần chuẩn bị được phép}} |
| Deliverables | {{TODO-EVENT: danh sách nộp — dự kiến: repo + demo/video + pitch; xác nhận với BTC}} |
| Scoring of AI-nativeness | {{TODO-EVENT: cách chấm — collab log? phỏng vấn?}} |

> **Tài sản mang theo cho event này** (cột "Bring" bên dưới, đã kiểm):
> kit này (docs), `data/nd174_trich.md` + `data/nd15_trich.md` (trích nguyên
> văn văn bản luật = data), hồ sơ 1–2 vụ xử phạt đã công bố công khai
> (bản tin = research corpus), API keys. KHÔNG mang: bất kỳ file code nào.

## The ruling: workshop vs product

The code rule governs the **submitted product's source code**, not your
development tools. Claude Code, Cursor, and the full AI_PRODUCT_FACTORY
harness (agents, skills, CLAUDE.md conventions, orchestration) are your
**workshop** — bring and use them freely. Every team uses AI tools; yours
are simply better configured, and that is a legitimate edge.

**The hard boundary:** the product repo is **standalone** —
- zero imports from the factory or any pre-existing private codebase;
- generates its own thin provider layer (see P3 in `04_REBUILD_PROMPTS.md`);
- own requirements/deps file; builds and runs from its own contents alone;
- every line has a commit timestamp inside the window.

Workshop produces the product; nothing of the workshop ships inside it.
Disclose the toolchain in the collaboration log header.

## Bring / don't bring

| Bring (permitted preparation) | Do NOT bring |
|---|---|
| Methodology: formulas, algorithms as *written specs*, decision tables | Source files from any prior repo |
| This kit: prompts, checklists, schedules, pitch/demo skeletons | Copy-pasted functions, "reference implementations" |
| Research corpus, citations, market stats | Snippets in notes that are actually code |
| Data files (prompt panels, eval sets, sample datasets — data, not code; regenerate live if the rules are strict about data too) | Pre-trained custom artifacts the rules exclude |
| API keys, accounts, hosting setup, dotfiles/tool config | |
| Pitch deck, demo script, business docs | |

Gray zone judgment call: **if it executes, it's code; if it explains, it's
knowledge.** When in doubt, write it as a spec and regenerate.

## The ethics line (say this proactively, verbatim, if challenged)

> "We prepared specs and research before the event, like any team prepares
> domain knowledge. Every line of code in the repo has a commit timestamp
> inside the window and an AI-generation trail in the collaboration log.
> Nothing hidden — we can regenerate any module live in front of you."

## Disclosure paragraph (goes in the collab-log header — see 08)

> Pre-event preparation disclosure: methodology specs, research corpus,
> data files, and pitch materials were prepared before the event (permitted
> preparation). Zero source code was reused; every line was newly generated
> in-window — verifiable via commit timestamps.

## Why this is a weapon, not a handicap

Rebuilding live from specs is (a) compliant, (b) faster than teams writing
from scratch, and (c) generates the richest possible AI collaboration log —
the meta-story judges reward. If the factory already built a similar system
once, you know the module order, the test lists, and the failure modes.
