# 12 — GO/NO-GO Gate Cards

Binary criteria for every checkpoint. A gate passes only if **every GO
condition is objectively true** — no "basically working". The NO-GO action
is pre-decided here so the tired version of you doesn't negotiate with it.
Gate reviews are 5 minutes, statuses spoken out loud, result logged in
`DECISIONS.md`.

---

## G-1 · Pre-event readiness (T-1 day) — "do we enter to compete?"

GO — all true:
- [ ] Rehearsal run completed through P2 on a mock problem (not just planned)
- [ ] Every provider key made ≥1 successful live call today
- [ ] Deploy pipe tested: commit → public URL 200
- [ ] ≥2 members can run the BOOTSTRAP flow unassisted
- [ ] 01_COMPLIANCE quotes verbatim rules; gray areas answered in writing

**NO-GO →** enter anyway but re-scope expectations: pick the simplest
archetype at H0 regardless of fit scores, cut list executes at first gate
automatically. Do not pretend readiness you didn't rehearse.

## G0 · Problem fit (H0 + 30 min) — "do we build this?"

GO — all true:
- [ ] One archetype scored ≥3/5
- [ ] Demo moment stated in ONE sentence, and it's computable from assets we
      verified we can access (sample fetched, not assumed)
- [ ] Invariant core + pivot surface each written in one line
- [ ] Product Lead and Tech Lead both said "go" out loud

**NO-GO →** narrow the problem yourselves: pick the sub-problem you CAN
demo (a smaller real result beats a bigger imagined one). Never start
building without a demo moment — that is building the wrong thing fast.

## G1 · Core engine (15%) — "is the heart real?"

GO — all true:
- [ ] `pytest` green on P1+P2, run twice (determinism confirmed)
- [ ] The core can compute the demo moment from fixture data
- [ ] No I/O inside the core module (spot-check imports)

**NO-GO →** cut-list item 1 fires; Builder-2 drops surface work and pairs on
core. Still red at 20% → shrink the invariant core spec itself (fewer
formulas/states), log it, re-run P2. The core is the only thing you may
shrink but never skip.

## G2 · End-to-end + SCOPE FREEZE (35%) — "is the demo data pitchable?"

GO — all true:
- [ ] One real run end-to-end: live inputs → pipeline → report, zero manual
      patching between stages
- [ ] The demo-moment number/artifact exists in a run file with its honesty
      metrics (CI / error count / trace) attached
- [ ] Pitcher looked at the result and can say the slide-4 sentence with a
      straight face
- [ ] Cut list reviewed; scope formally frozen

**NO-GO →** all hands on the pipeline until E2E passes; P6/P7 wait. If the
data is *real but weak*, that is a GO — pitch the honesty story (CI-vs-N,
"here's what one night of measurement shows"). Weak-but-real passes; faked
or hand-assembled never does.

## G3 · Deploy (50%) — "is it public?"

GO — all true:
- [ ] Public URL returns 200 **from a phone on mobile data** (not venue wifi,
      not localhost)
- [ ] Page/endpoint shows real run data
- [ ] Health endpoint up

**NO-GO →** execute the static-fallback cut immediately (pre-rendered HTML
of the real report). Do not sink another hour into the platform — redirect
saved time to P8 and the video. A static page of real data beats a broken
dynamic one.

## G4 · Video export (80%) — "is the primary demo in the can?"

GO — all true:
- [ ] Final MP4 exported (not "just needs rendering"), length ≤ limit
- [ ] Plays start-to-finish on a device that didn't edit it
- [ ] Every number spoken in it exists in a run file or the collab log

**NO-GO →** stop polishing, ship the rough cut. A complete rough video beats
a perfect missing one. Rendering starts no later than 78% — set that alarm
at hour 0.

## G5 · Submit (95%) — "is everything in?"

GO — all true:
- [ ] PRE_SUBMIT checklist 100% (secrets grep, standalone pytest on a
      factory-free venv, collab log ↔ git history match)
- [ ] Every deliverable link opened from a phone and verified public
- [ ] Submission confirmed (screenshot the confirmation)

**NO-GO →** submit whatever passes NOW and escalate the missing piece to
organizers with timestamped evidence in hand. Partial submission at 95%
beats complete submission at 101%.

## G6 · Live encore (before stepping on stage) — "do we demo live?"

GO — all true:
- [ ] The exact encore interaction ran twice today without a flake
- [ ] Stage network verified OR hotspot active on the demo machine
- [ ] Fallback page open in the next browser tab
- [ ] A builder (not the pitcher) is driving

**NO-GO →** video only. Say "happy to run it live at the booth after" —
judges respect a team that knows its failure modes. Never debug on stage.

---

## What this file deliberately does NOT gate

Slides polish, code elegance, feature count, README beauty — none of these
have gates because none of them should ever block. If a discussion starts
about gating something not on a card above, the answer is the charter's
scope-freeze rule, not a new gate. **Keep: 7 cards. Add: nothing, until a
real event proves a gap.**
