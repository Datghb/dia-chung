# 07 — Demo Script (≤5-min video + live encore)

The video is the **primary** demo (it cannot crash); live is the encore.
Shoot at 65–80% of the window per the schedule.

## 5-minute structure

| Time | Beat | Content |
|---|---|---|
| 0:00–0:30 | Hook | The pain in the user's own words + the cost number. No product yet. |
| 0:30–1:15 | Problem | Who hurts, when, why current tools miss it (the slide-3 insight, one stat) |
| 1:15–3:15 | **The wow** | Screen-recorded real product on real data: the demo moment first (30 s), then the flow that produced it. Narrate outcomes, not clicks. |
| 3:15–4:00 | How it's built | Architecture in one diagram + AI-native story: "every line generated in-window — here's the log." Show a tests-green run. |
| 4:00–4:45 | Business | Who pays, price, the pilot ask, why it compounds |
| 4:45–5:00 | Close | Product name + one-sentence promise + URL on screen |

## Shot list

1. Screen: the deployed URL loading real data (proof of live).
2. Screen: the core interaction / run streaming (JSONL lines appearing =
   "it's really computing").
3. Screen: the report/digest with the demo-moment number highlighted.
4. Screen: `pytest` green + git log with `[AI-generated]` commits.
5. Face/venue shot (optional, 5 s) — humanizes; skip if time-tight.
6. Screen: the partner deliverable (P8 artifact).

## Recording rules

- Record in one 1080p take per shot; edit cuts, don't re-record marathons.
- Cursor slow, zoom on numbers; captions for every spoken claim.
- Mute notifications; demo account/data pre-loaded; `.env` never on screen.
- Export early — rendering at 94% of the window is how teams miss deadlines.

## Live encore (after the video, if judges want more)

- One rehearsed interaction, driven by a builder, pinned inputs
  (temperature/seed pinned where possible).
- Offer the judges' own AI a call to your MCP/API surface — the strongest
  "AI-native" flex, only if Gate 3 fallbacks weren't needed.
- If anything flakes: switch to the pre-rendered static fallback page
  without commentary. Never debug on stage.
