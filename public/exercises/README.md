# Exercise image library (Miami Science)

Photorealistic sets for 20 exercises (12 featured with display_order + 8 library). Same style across both sets: dark charcoal background, side lighting, vertical card crop, no text/logos.

**Panel → slug mapping** (which zip file became which exercise): see [`ASSET_MANIFEST.md`](./ASSET_MANIFEST.md). To refresh assets from a new zip: `node scripts/sync-fitness-zip-assets.mjs /path/to/fitness_images_split.zip`

## Naming convention

- **Men’s set (default):** `exercise-{slug}.png`
- **Women’s set:** `exercise-{slug}-women.png`

`{slug}` is the exercise slug (e.g. `bench-press`, `pull-up`). Use `nameToSlug(exerciseName)` or the slug from the exercises table.

## File reference

### Men’s set (default)

| Slug           | File                         |
|----------------|------------------------------|
| bench-press    | exercise-bench-press.png     |
| squat          | exercise-squat.png           |
| deadlift       | exercise-deadlift.png        |
| pull-up        | exercise-pull-up.png         |
| overhead-press | exercise-overhead-press.png  |
| barbell-row    | exercise-barbell-row.png      |
| plank          | exercise-plank.png           |
| lunge          | exercise-lunge.png           |
| incline-bench-press | exercise-incline-bench-press.png  |
| push-up        | exercise-push-up.png              |
| romanian-deadlift   | exercise-romanian-deadlift.png    |
| leg-press      | exercise-leg-press.png            |
| lat-pulldown   | exercise-lat-pulldown.png         |
| lateral-raise  | exercise-lateral-raise.png        |
| leg-curl      | exercise-leg-curl.png            |
| barbell-curl  | exercise-barbell-curl.png         |
| tricep-pushdown | exercise-tricep-pushdown.png    |
| crunch        | exercise-crunch.png               |
| cable-fly     | exercise-cable-fly.png            |
| calf-raise    | exercise-calf-raise.png           |

### Women’s set

| Slug           | File                             |
|----------------|----------------------------------|
| bench-press    | exercise-bench-press-women.png   |
| squat          | exercise-squat-women.png         |
| deadlift       | exercise-deadlift-women.png      |
| pull-up        | exercise-pull-up-women.png       |
| overhead-press | exercise-overhead-press-women.png|
| barbell-row    | exercise-barbell-row-women.png    |
| plank          | exercise-plank-women.png         |
| lunge          | exercise-lunge-women.png          |
| incline-bench-press | exercise-incline-bench-press-women.png |
| push-up        | exercise-push-up-women.png            |
| romanian-deadlift   | exercise-romanian-deadlift-women.png  |
| leg-press      | exercise-leg-press-women.png         |
| lat-pulldown   | exercise-lat-pulldown-women.png      |
| lateral-raise  | exercise-lateral-raise-women.png     |
| leg-curl      | exercise-leg-curl-women.png          |
| barbell-curl  | exercise-barbell-curl-women.png      |
| tricep-pushdown | exercise-tricep-pushdown-women.png  |
| crunch        | exercise-crunch-women.png            |
| cable-fly     | exercise-cable-fly-women.png         |
| calf-raise    | exercise-calf-raise-women.png        |

## Wiring in the app

- **Per-user variant:** Users choose “Men’s set” or “Women’s set” in Account → Exercise images. `getExerciseImageForUser` resolves, in order: DB **image_url** (if set) → optional **`EXERCISE_PHOTO_PATH_OVERRIDES`** in `src/lib/exerciseMedia.ts` → bundled paths above for slugs in `FEATURED_EXERCISE_SLUGS` → otherwise the SVG illustration for that slug.
- **Custom image:** In Admin → Exercise library you can set **image_url** for any exercise to override (e.g. custom photo or CDN URL). Paths starting with `/` (e.g. `/exercises/exercise-bench-press.png`) or full `https://` URLs are accepted.
- **WebP / alternate files:** See `public/exercises/photos/README.md` and add paths in `src/lib/exerciseMedia.ts`.
- **Production:** If you serve assets from a CDN, set **image_url** in Admin to the full URL, or keep the 20 bundled exercises using the bundled paths (same origin).
