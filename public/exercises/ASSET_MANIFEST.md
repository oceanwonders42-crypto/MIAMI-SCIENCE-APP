# Bundled exercise photos — asset manifest

Source: `fitness_images_split.zip` (40 panels: `fitness_image_01.png` … `fitness_image_40.png`, row-major left-to-right, top-to-bottom).

Mapping (men’s = panels 1–20, women’s = panels 21–40), aligned with `FEATURED_EXERCISE_SLUGS` order in `src/lib/exercises.ts`:

| # | Slug | Men’s file | Women’s file | Source panel (men) | Source panel (women) |
|---|------|------------|----------------|---------------------|----------------------|
| 1 | bench-press | exercise-bench-press.png | exercise-bench-press-women.png | 01 | 21 |
| 2 | squat | exercise-squat.png | exercise-squat-women.png | 02 | 22 |
| 3 | deadlift | exercise-deadlift.png | exercise-deadlift-women.png | 03 | 23 |
| 4 | pull-up | exercise-pull-up.png | exercise-pull-up-women.png | 04 | 24 |
| 5 | overhead-press | exercise-overhead-press.png | exercise-overhead-press-women.png | 05 | 25 |
| 6 | barbell-row | exercise-barbell-row.png | exercise-barbell-row-women.png | 06 | 26 |
| 7 | plank | exercise-plank.png | exercise-plank-women.png | 07 | 27 |
| 8 | lunge | exercise-lunge.png | exercise-lunge-women.png | 08 | 28 |
| 9 | incline-bench-press | exercise-incline-bench-press.png | exercise-incline-bench-press-women.png | 09 | 29 |
| 10 | push-up | exercise-push-up.png | exercise-push-up-women.png | 10 | 30 |
| 11 | romanian-deadlift | exercise-romanian-deadlift.png | exercise-romanian-deadlift-women.png | 11 | 31 |
| 12 | leg-press | exercise-leg-press.png | exercise-leg-press-women.png | 12 | 32 |
| 13 | lat-pulldown | exercise-lat-pulldown.png | exercise-lat-pulldown-women.png | 13 | 33 |
| 14 | lateral-raise | exercise-lateral-raise.png | exercise-lateral-raise-women.png | 14 | 34 |
| 15 | leg-curl | exercise-leg-curl.png | exercise-leg-curl-women.png | 15 | 35 |
| 16 | barbell-curl | exercise-barbell-curl.png | exercise-barbell-curl-women.png | 16 | 36 |
| 17 | tricep-pushdown | exercise-tricep-pushdown.png | exercise-tricep-pushdown-women.png | 17 | 37 |
| 18 | crunch | exercise-crunch.png | exercise-crunch-women.png | 18 | 38 |
| 19 | cable-fly | exercise-cable-fly.png | exercise-cable-fly-women.png | 19 | 39 |
| 20 | calf-raise | exercise-calf-raise.png | exercise-calf-raise-women.png | 20 | 40 |

**Regenerate from zip** (from repo root):

```bash
node scripts/sync-fitness-zip-assets.mjs /path/to/fitness_images_split.zip
```
