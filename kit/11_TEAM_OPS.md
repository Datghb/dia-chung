# 11 — Team Ops: parallel builders, one repo, 48 hours

The charter (00) defines *who decides*; this file defines *how the team
mechanically works* — especially with multiple Claude Code sessions writing
to one repo.

## Git workflow for parallel AI sessions

- **Trunk-based, no long branches.** Each builder commits small green
  milestones straight to `main` (or a branch merged within the hour). A
  branch older than 2 hours is a merge bomb.
- **Pull-rebase before every prompt-session**, push immediately after every
  green commit. The repo state IS the team sync mechanism.
- **Tech Lead is the only merge-conflict resolver.** Builders who hit a
  conflict stop and hand it over — never "quickly fix" someone else's module
  (that breaks the one-writer rule AND the collab log attribution).
- **Both laptops pre-configured** (PRE_EVENT): git identity, the AI
  co-author trailer as a commit template, push access to the product repo
  tested.
- The interface between builders is **P1's data model file** — it's frozen
  after review; changing it requires both builders present (5-min sync).

## Multiple Claude Code sessions without drift

- The product repo's `CLAUDE.md` (written at P0) is the **single source of
  conventions**. Only the Tech Lead edits it; every session change to it is
  announced in the team channel.
- Start each new session by having the AI re-read `CLAUDE.md` + the Decision
  Block — two sessions with different assumptions generate incompatible code.
- One session = one module (matches the one-writer rule). Don't run two
  sessions against the same module "to go faster" — you'll pay it back in
  conflicts and log confusion.

## Environment parity (kill "works on my machine" at P0)

- Same Python version pinned in `README` quickstart; venv created by the
  same two commands on both laptops.
- `requirements.txt` is the only dependency source; adding a dep = commit +
  announce (charter: post-midpoint needs Tech Lead sign-off).
- `.env` synced manually to both laptops at hour 0 (never via git); when a
  key rotates, the quota owner updates **both** machines immediately.
- After P4, run the smoke test on the *other* builder's laptop once — cheap
  insurance the demo doesn't depend on one machine's state.

## Sleep-shift handoff (48 h events)

Write `HANDOFF.md` in the repo root before going down (5 minutes, template):

```markdown
## Handoff — <name> → <name>, <time>
- Running now: <run/deploy in flight, where its output lands, ETA>
- Last green: <module + commit hash>
- Next up: <the exact next P-prompt / task, any filled slots ready>
- Blocked/watch: <flaky thing, quota level, weird test>
- Do NOT touch: <files mid-edit, runs mid-flight>
```

The waker reads HANDOFF.md + latest collab-log entries before touching
anything. No verbal-only handoffs at 3 AM — nobody remembers them.

## Decision log

Append every non-trivial decision to `DECISIONS.md` in the repo root, one
line each: `<time> · <decision> · <who called it> · <what it replaced>`.
Cuts, pivots, dep additions, schedule slips. The charter's "no relitigating"
rule only works when the decision is written where everyone can see it.
(Decision Block = entry #1.)

## Bus factor & backups

Fill at team lock — every role has a named backup who can limp through it:

| Role | Primary | Backup | Backup has done |
|---|---|---|---|
| Tech Lead | {{NAME}} | {{NAME}} | merged once, knows deploy |
| Builder-1 | {{NAME}} | {{NAME}} | ran one P-prompt in rehearsal |
| Data/Eval | {{NAME}} | {{NAME}} | executed one run |
| Pitcher | {{NAME}} | {{NAME}} | delivered the pitch once in rehearsal |

The rehearsal run (PRE_EVENT) is where backups earn the checkmark.

## Single-owner assignments (fill at hour 0)

- **Demo machine:** {{NAME}}'s laptop — kept clean: demo data loaded,
  fallback page bookmarked, notifications off from Gate 3 onward. Nobody
  else installs anything on it.
- **Mentor/organizer liaison:** {{NAME}} — visits the mentor desk at the
  *start* of a stuck period (20-min rule), not the end; also owns rules
  clarifications in writing.
- **Quota owner:** {{NAME}} (from 03 budget table).
- **Submission owner:** {{NAME}} (Pitcher by default) — the only person who
  presses submit, from the checklist, at 95%.
