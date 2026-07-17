# 00 — Team Charter: roles, rules, decisions

Fill the roster before team lock. Every role has an AI backing in the factory
(workshop side) — humans direct, verify, and decide; AI generates.

## Roles (scale 2–6 people; small teams wear 2 hats)

| Role | Owns | Factory backing (workshop) |
|---|---|---|
| **Product Lead** | Track/scope decisions, partner/user interviews at venue, the demo moment, judge strategy. **Sole authority to CUT scope.** | `ai-product-planner`, `retention-designer` |
| **Tech Lead** | P0 conventions, repo, merge gates, architecture calls, deploy | `architect`, `code-reviewer` agents |
| **Builder(s) 1–3** | Drive Claude Code on assigned modules per the parallelism map | `04_REBUILD_PROMPTS.md` |
| **Data/Eval** | Domain data, prompt/eval sets, first real run, results analysis, QA of AI output | `eval-designer`, `dataset-curator` |
| **Story/Pitcher** | Slides, ≤5-min video, Demo Day delivery, Q&A rehearsal, collab-log curation | `content-writer`, `ux-writer` workers |

**2-person split:** Builder-1 = Tech Lead + Builder; Person-2 = Product +
Pitcher + Data. Both keep the collab log.
**Roster:** {{TODO-EVENT: điền tên = vai trò khi chốt đội hình, ví dụ
`Kiệt = Tech Lead + Builder-1` · `... = Product Lead + Data` · `... = Pitcher`}}

## Decision rules

1. **Timebox every decision.** Problem triage: 30 min hard stop
   (`02_PROBLEM_INTAKE.md`). Any technical dispute: 10 min, then Tech Lead
   decides. Any scope dispute: Product Lead decides. Team commits — no
   relitigating a decided question until a gate fails.
2. **Direction freezes after Phase B** (BOOTSTRAP). **Scope freezes at the
   midpoint gate** — after that, cut-only.
3. **One writer per module.** The parallelism map assigns files; no two
   people prompt against the same file. Cross-module interfaces go through
   the Tech Lead.
4. **Gates are blocking.** At each `05_SCHEDULE.md` gate the team meets for
   5 minutes: green → continue; behind → execute the pre-agreed cut list.
   Nobody "just needs one more hour."

## Standing rules

- **TDD every module** — tests RED before implementation, no exceptions.
- **Commit every green milestone** with `[AI-generated]` + AI co-author
  trailer; collab-log entry written *at the moment of commit* by the committer.
- **Never hand-edit AI output** — re-prompt with the failing test or spec line.
- **Submit at 95% of the window.** The last 5% is buffer, not build time.
- **Sleep in shifts** — minimum 4 h/person/night on 48 h events. Hour-40
  judgment beats hour-20 code.
- **No new dependencies after the midpoint** without Tech Lead sign-off.
- **Secrets hygiene:** keys live in `.env` on two laptops max; pre-submit
  checklist includes a secrets grep of the public repo.

## Communication

- One shared channel ({{TODO-EVENT: kênh chat của team}}); gate meetings in person.
- Status format at gates: `module · state (RED/GREEN/blocked) · next commit ETA`.
- Blockers > 20 min get escalated to the whole team immediately — no silent
  stalls. Use the event's mentor/help desk ({{TODO-EVENT: vị trí/kênh mentor}}) early, not at the end.
