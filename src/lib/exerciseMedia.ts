/**
 * Optional local paths for bundled exercise photos (override default PNG naming).
 * Default paths (no entry needed): `/exercises/exercise-{slug}.png` and `exercise-{slug}-women.png`
 * for slugs in FEATURED_EXERCISE_SLUGS — see public/exercises/README.md.
 *
 * Add WebP (or other) assets under e.g. `public/exercises/photos/` and map them here:
 *
 * @example
 * ```ts
 * "bench-press": {
 *   men: "/exercises/photos/bench-press.webp",
 *   women: "/exercises/photos/bench-press-women.webp",
 * },
 * ```
 */
export type ExercisePhotoOverride = {
  /** Shown when profile / variant is men’s set (or default). */
  men?: string;
  /** Shown when profile / variant is women’s set. */
  women?: string;
  /** Used for both variants if the specific key is omitted. */
  default?: string;
};

export const EXERCISE_PHOTO_PATH_OVERRIDES: Record<string, ExercisePhotoOverride> = {
  // Example slugs (uncomment and add files under public/ when ready):
  // "bench-press": {
  //   men: "/exercises/photos/bench-press.webp",
  //   women: "/exercises/photos/bench-press-women.webp",
  // },
  // "squat": { men: "/exercises/photos/squat.webp", women: "/exercises/photos/squat-women.webp" },
  // "deadlift": { men: "/exercises/photos/deadlift.webp", women: "/exercises/photos/deadlift-women.webp" },
  // "pull-up": { men: "/exercises/photos/pull-up.webp", women: "/exercises/photos/pull-up-women.webp" },
  // "overhead-press": { men: "/exercises/photos/overhead-press.webp", women: "/exercises/photos/overhead-press-women.webp" },
  // "barbell-row": { men: "/exercises/photos/barbell-row.webp", women: "/exercises/photos/barbell-row-women.webp" },
  // "plank": { men: "/exercises/photos/plank.webp", women: "/exercises/photos/plank-women.webp" },
  // "lunge": { men: "/exercises/photos/lunge.webp", women: "/exercises/photos/lunge-women.webp" },
  // "incline-bench-press": { men: "/exercises/photos/incline-bench-press.webp", women: "/exercises/photos/incline-bench-press-women.webp" },
  // "push-up": { men: "/exercises/photos/push-up.webp", women: "/exercises/photos/push-up-women.webp" },
  // "romanian-deadlift": { men: "/exercises/photos/romanian-deadlift.webp", women: "/exercises/photos/romanian-deadlift-women.webp" },
  // "leg-press": { men: "/exercises/photos/leg-press.webp", women: "/exercises/photos/leg-press-women.webp" },
  // "barbell-curl": { men: "/exercises/photos/barbell-curl.webp", women: "/exercises/photos/barbell-curl-women.webp" },
  // "cable-fly": { men: "/exercises/photos/cable-fly.webp", women: "/exercises/photos/cable-fly-women.webp" },
  // "calf-raise": { men: "/exercises/photos/calf-raise.webp", women: "/exercises/photos/calf-raise-women.webp" },
  // "crunch": { men: "/exercises/photos/crunch.webp", women: "/exercises/photos/crunch-women.webp" },
  // "lat-pulldown": { men: "/exercises/photos/lat-pulldown.webp", women: "/exercises/photos/lat-pulldown-women.webp" },
  // "lateral-raise": { men: "/exercises/photos/lateral-raise.webp", women: "/exercises/photos/lateral-raise-women.webp" },
  // "leg-curl": { men: "/exercises/photos/leg-curl.webp", women: "/exercises/photos/leg-curl-women.webp" },
  // "tricep-pushdown": { men: "/exercises/photos/tricep-pushdown.webp", women: "/exercises/photos/tricep-pushdown-women.webp" },
};
