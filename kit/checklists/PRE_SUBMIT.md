# Checklist — Pre-submit (start at 90% of the window)

## Repo hygiene (blocking)

- [ ] Secrets grep on the public repo: `git grep -iE "api[_-]?key|secret|token|password" -- ':!*.md'` returns nothing real; `.env` not in history
- [ ] Standalone check: no imports from the factory or any private codebase (`grep -rE "AI_PRODUCT_FACTORY|agent_core" --include="*.py"` clean)
- [ ] `pip install -r requirements.txt && pytest` green **on a machine/venv that never had the factory installed**
- [ ] README: Decision Block, quickstart, live URL, license
- [ ] Every commit in-window, `[AI-generated]` tagged, AI co-author trailer present

## Deliverables (per {{DELIVERABLES_LIST}})

- [ ] Slides exported (PDF + source)
- [ ] Demo video ≤ {{LIMIT}} min, plays from a clean device, uploaded + local + drive backup
- [ ] Public repo URL correct branch, default branch builds
- [ ] Live URL up; health endpoint 200; fallback static page also live
- [ ] Collab log: header totals filled, entries match git history 1:1, disclosure paragraph present

## Final

- [ ] Submit at 95% of the window — all links opened from a phone (not your laptop) to verify public access
- [ ] Live-encore rehearsed once post-submit; fallback page bookmarked on the demo machine
