# 08 — AI Collaboration Log: discipline + templates

If the event scores AI-nativeness, the log is a **product**, not paperwork.
It must let a judge verify (a) all code was AI-generated in-window, and
(b) humans directed, tested, and decided — a collaboration story, not a
prompt dump. Keep it in the public repo root as `AI_COLLABORATION_LOG.md`.

## Logging discipline

1. **One entry per prompt-session** (a session = one module/task driven to done).
2. Log **at the moment of commit**, not retroactively. The committer writes it.
3. Every code commit carries `[AI-generated]` in the message and the
   `Co-Authored-By:` AI trailer — the git log is the machine-verifiable
   spine; this file is the narrative on top. **Never let them diverge.**
4. **Log failures and rejections too** — "AI proposed X, tests failed,
   re-prompted with Y" is *stronger* evidence of real collaboration than a
   perfect streak.
5. Spread commits across the whole window — an AI scoring system will check
   timestamp distribution, prompt→code→test→commit causality, tests-first
   ordering, and human-review evidence.

## Header block (fill at the 90% mark)

```markdown
# AI Collaboration Log — {{PRODUCT}} @ {{EVENT}}
Team: {{TEAM}} · Track: {{TRACK}} · Window: {{START}} → {{END}} ({{TZ}})
Toolchain: Claude Code (primary builder) · {{OTHERS}}
Totals: {{N}} sessions · {{N}} commits · {{N}} tests (all green) ·
{{LOC}} lines, 100% AI-generated in-window

Pre-event preparation disclosure: methodology specs, research corpus, data
files, and pitch materials were prepared before the event (permitted
preparation). Zero source code was reused; every line was newly generated
in-window — verifiable via the commit timestamps below.
```

## Entry template

```markdown
### [#seq] <module/task> — <timestamp, event TZ>
- **Human intent:** what we asked for and why now (1–2 lines)
- **Tool/model:** e.g. Claude Code (model id)
- **Prompt approach:** kit prompt used (04 §Pn), spec pasted, tests-first? constraints?
- **AI output:** files created/changed, LOC, tests generated
- **Verification:** test results (X passed), manual check performed
- **Human decision:** accepted as-is / re-prompted (why) / regenerated
  (what & why — changes must be prompted regenerations, never hand-written)
- **Commit:** <hash>
```

## Example entry (style reference)

### [#3] Core scoring engine — day 1, 22:4x
- **Human intent:** core math must be pure + provable before any network code.
- **Tool/model:** Claude Code (claude-fable-5).
- **Prompt approach:** P2 with formulas + edge-case list pasted as spec;
  tests written first (RED).
- **AI output:** `tests/test_core.py` (19 tests), then `pkg/core.py` (~200 LOC).
- **Verification:** 18/19 green first pass; 1 failure was test tolerance vs
  intentional 2 dp rounding.
- **Human decision:** fixed the test (rounding is a report-schema feature),
  not the implementation. All 19 green.
- **Commit:** abc1234
