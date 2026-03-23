# Exercise library — content checklist before launch

Use this list to ensure the exercise library feels complete. All items are optional but improve perceived quality.

---

## 1. Image coverage

- [ ] **20 with bundled images** — Men’s + women’s sets for: featured 12 (Bench Press … Leg Press) plus Lat Pulldown, Lateral Raise, Leg Curl, Barbell Curl, Tricep Pushdown, Crunch, Cable Fly, Calf Raise. They show automatically per user variant. No **image_url** needed in Admin for these 20.
- [ ] **Remaining exercises** — For others, set **Image URL** in Admin → Exercise library → Edit if you want a custom image; otherwise letter placeholder is used.
- [ ] **Cardio / Mobility** — Decide if you want placeholder images or leave as letter fallback for Running, Cycling, Rowing Machine, Jump Rope, Hip Mobility, Shoulder Mobility, Cat Cow.

## 2. Descriptions

- [ ] All **32 seeded exercises** have a short description (migration 00023 backfills them; re-run if needed).
- [ ] Spot-check a few in the app: Training → Browse → open an exercise and confirm “How to” text is clear and short.
- [ ] If you add new exercises via Admin or SQL, add a one-line description.

## 3. Category and muscle group

- [ ] **Categories** in use: Strength, Cardio, Mobility. No cleanup needed unless you add new categories.
- [ ] **Muscle groups** in use: Chest, Back, Legs, Shoulders, Arms, Core. Cardio exercises have no muscle group; that’s intentional.
- [ ] If you add exercises, use the same category/muscle values so filters stay consistent.

## 4. Featured / display order

- [ ] **Current featured (display_order 1–12):** Bench Press, Squat, Deadlift, Pull-Up, Overhead Press, Barbell Row, Plank, Lunge, Incline Bench Press, Push-Up, Romanian Deadlift, Leg Press. These show first on Training home and Browse.
- [ ] To feature more exercises: Admin → Exercise library → Edit → set **Display order** (e.g. 13, 14). Lower number = higher in list. Leave empty to sort by name only.

## 5. Admin and QA

- [ ] Open **Training** and confirm the first cards show the 12 featured (with images if variant is set).
- [ ] Open **Browse** and confirm filters (Category, Muscle) work and counts look right.
- [ ] Open **Account → Exercise images** and switch between Men’s set and Women’s set; confirm Training and exercise detail update.
- [ ] Open a few **exercise detail** pages and confirm image, description, and “Add to workout” / “Start with this” work.
- [ ] If you use production URLs for images, confirm they load over HTTPS and CORS if applicable.

## 6. Optional polish

- [ ] Add 2–5 more exercises to the seed (e.g. Goblet Squat, Hip Thrust, Leg Extension) if you want a larger library.
- [ ] Standardize any duplicate or near-duplicate names (e.g. “Tricep Pushdown” vs “Tricep Push-down”) in the seed so search and filters stay clean.

---

**Quick reference**

- **Exercise library admin:** `/admin/exercises`
- **Image paths:** `public/exercises/README.md`
- **Bundled image slugs (20):** bench-press, squat, deadlift, pull-up, overhead-press, barbell-row, plank, lunge, incline-bench-press, push-up, romanian-deadlift, leg-press, lat-pulldown, lateral-raise, leg-curl, barbell-curl, tricep-pushdown, crunch, cable-fly, calf-raise
