# Hackathon Kit — reusable AI-native hackathon template

A **documents-only** kit for hackathons with a "code must be newly written /
AI-generated in-window" rule. You bring **knowledge, not code**: the kit is
legal preparation; the product repo is generated fresh at the event.

Generalized from the VAIC 2026 AgentAttract package
(`projects/agentattract/docs/hackathon/`) — see that folder for a fully
instantiated example.

## The three layers (never mix them)

| Layer | What | At the event |
|---|---|---|
| **Workshop** | AI_PRODUCT_FACTORY: Claude Code, agents, skills, API keys | Bring it. It's toolchain — disclose in the collab log. Never ships in the product. |
| **Knowledge kit** | THIS folder, instantiated per event | Feed it to the AI. Docs are permitted preparation. |
| **Product repo** | Fresh, standalone, zero factory imports | 100% generated in-window. The only thing judges score as code. |

## How to use

**Before the event (~1–2 h):**
1. Copy this folder to `projects/<event-name>/kit/` (or run `/hackathon-init <event-name>`).
2. Fill every `{{PLACEHOLDER}}` in [01_COMPLIANCE.md](01_COMPLIANCE.md),
   [00_TEAM_CHARTER.md](00_TEAM_CHARTER.md), and [05_SCHEDULE.md](05_SCHEDULE.md)
   with the event's actual rules, your roster, and the real time window.
3. Work through [checklists/PRE_EVENT.md](checklists/PRE_EVENT.md).

**At problem reveal:**
4. Open Claude Code in the (empty) product repo with this kit folder readable.
5. Paste [BOOTSTRAP.md](BOOTSTRAP.md) + the problem statement / pain point /
   what you want to solve. The AI runs intake → picks an archetype → fills the
   prompt pack → drives the build, gate by gate.

**The whole flow in one line:**

```
fill facts (pre-event) → feed BOOTSTRAP + problem (H0) → AI decides & builds → humans gate, test, pitch
```

## Kit map

| File | Purpose | When used |
|---|---|---|
| [BOOTSTRAP.md](BOOTSTRAP.md) | **The AI entry prompt** — turns problem statement into a build plan | H0, paste first |
| [00_TEAM_CHARTER.md](00_TEAM_CHARTER.md) | Roles (2–6 people), decision rules, standing rules | Pre-event |
| [01_COMPLIANCE.md](01_COMPLIANCE.md) | Bring / don't-bring boundary, ethics line, disclosure text | Pre-event, fill per rules |
| [02_PROBLEM_INTAKE.md](02_PROBLEM_INTAKE.md) | 30-min timeboxed triage protocol at reveal | H0 |
| [03_ARCHITECTURE_MENU.md](03_ARCHITECTURE_MENU.md) | Pre-decided stack per archetype — decisions, not code | H0–H1 |
| [04_REBUILD_PROMPTS.md](04_REBUILD_PROMPTS.md) | Generic P0–P8 prompt pack with `<<SLOTS>>` | H1 onward |
| [05_SCHEDULE.md](05_SCHEDULE.md) | %-based schedule with milestone gates (24 h / 48 h) | Whole event |
| [06_PITCH_DECK.md](06_PITCH_DECK.md) | 12-slide skeleton + judge-type Q&A bank | Last 40% |
| [07_DEMO_SCRIPT.md](07_DEMO_SCRIPT.md) | ≤5-min demo/video structure + fallback rules | Last 30% |
| [08_AI_COLLAB_LOG.md](08_AI_COLLAB_LOG.md) | Log discipline + entry template (often a scored deliverable) | Every commit |
| [09_RISK_MATRIX.md](09_RISK_MATRIX.md) | Generic risks + mitigations + the mandatory cut list | Pre-event + gates |
| [10_HARNESS_GUARDRAILS.md](10_HARNESS_GUARDRAILS.md) | Workshop harness setup + P9 product-guardrails spec + eval gate | Pre-event + after P6 |
| [11_TEAM_OPS.md](11_TEAM_OPS.md) | Git workflow for parallel AI sessions, env parity, handoffs, decision log, bus factor | Pre-event + whole event |
| [12_GO_NO_GO.md](12_GO_NO_GO.md) | 7 binary gate cards (G-1…G6) with pre-decided NO-GO actions | Every gate |
| [13_DOMAIN_BRIEF.md](13_DOMAIN_BRIEF.md) | **INSTANTIATED — AIZ Legal-KG**: hướng đi, KG schema, luật gắn nhãn, bộ bình luận, study case, pitch | H0, AI đọc cùng BOOTSTRAP |
| [data/](data/) | Trích nguyên văn NĐ 174/2026 (Đ2, Đ4, Đ95) đã đối chiếu; TODO: NĐ15 + study cases | Pre-event + P4 ingest |

**If you read nothing else:** BOOTSTRAP.md (feed to AI), your role's rows in
00, and the 7 gate cards in 12. The rest is reference the AI reads for you.
| [checklists/](checklists/) | PRE_EVENT, HOUR_0, PRE_SUBMIT | As named |

## Non-negotiables (the kit's spine)

1. **Bring knowledge, not code.** Specs, formulas, decision tables, prompts — yes. Source files — never.
2. **The pivot is the surface, not the core.** Pre-decide an invariant core per archetype; adapt only domain data/prompts to the problem.
3. **TDD per module, commit per green milestone**, `[AI-generated]` tag + AI co-author trailer. The git log is the compliance proof.
4. **Never hand-edit AI output — re-prompt with the failing test.**
5. **Submit at 95% of the window, not 100%.**
