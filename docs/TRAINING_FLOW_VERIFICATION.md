# Training flow verification — launch readiness

Strict audit of training-specific flows. **Do not redesign; only true blockers or smallest safe fixes.**

---

## 1. TRAINING FLOW STATUS

| Flow | Status | Notes |
|------|--------|--------|
| Training home visual quality | **OK** | 6 cards from `getExercisesPreview(6)`, ordered by `display_order`; images via `getExerciseImageForUser`; placeholder letter when no image. |
| Browse experience | **OK** | Filtered list, search (URL `q`), grid 2-col; image resolution and placeholders consistent. |
| Men/women image switching | **OK** | `profile.exercise_image_variant` read on server; passed to Library, Discovery, Browse, Detail; `getExerciseImageForUser(exercise, variant)` used everywhere. |
| Exercise detail pages | **OK** | Image, description, Add to workout / Start with this; stats and history when present. Unknown slug renders with slug-derived name + letter fallback (no 404). |
| Start workout | **OK** | "Start with this" creates workout and redirects to session with `?exercise=Name`; modal opens with name prefilled. "Log workout" creates workout and refreshes (no redirect). |
| Add exercise to workout | **OK** | Session: "+ Add exercise" opens modal; prefill from detail works. Both detail buttons create a **new** workout and redirect (no "add to current" from detail). |
| Log set flow | **OK** | `ExerciseEntryForm` create/update; sets, reps, weight, notes; server actions revalidate; modal close and refresh. |
| Rest timer | **OK** | Client-only; presets 30/60/90/120s; countdown; Done state; no persistence. |
| Session on mobile widths | **OK** | `grid-cols-2`, `min-h-[48px]`/`52px`, `touch-manipulation`, `px-4 md:px-6`, bottom nav. Modals use `p-4`; verify scroll on small viewports on device. |
| Placeholder / fallback (no bundled image) | **OK** | `getExerciseImageForUser` returns `null` when not in `FEATURED_EXERCISE_SLUGS` and no `image_url`; `ExerciseImage` and `ExerciseCard` show first-letter in gradient box on null or `onError`. |

**Overall:** No true blockers found. All 10 flows are implemented and wired; launch is feasible from a training-flow perspective.

---

## 2. TRUE BLOCKERS

**None identified.**

- Auth: dashboard layout redirects if not logged in or profile incomplete; training page always has user + profile.
- Images: 20 slugs in `FEATURED_EXERCISE_SLUGS`; paths `/exercises/exercise-{slug}.png` and `-women.png`; `isValidImageUrl` accepts `/` paths.
- Workout/entry CRUD: server actions check user and workout ownership; revalidate paths include `/training` and `/training/workout/[id]`.
- Session: `notFound()` when workout missing or not owned; prefill opens add-form via `useEffect`.

---

## 3. HIGH-RISK AREAS

1. **"Log workout" does not open the new workout**  
   After saving, the form closes and the page refreshes; the new workout appears in "Recent" but the user is not taken to the session. Many users will expect to land on the new workout to add exercises. **Suggested fix (if desired):** After `createWorkoutAction` success, `router.push(ROUTES.trainingWorkout(result.id))` instead of (or in addition to) `router.refresh()`.

2. **"Add to workout" / "Start with this" always create a new workout**  
   From exercise detail, both buttons create a new workout and redirect. If the user already has an in-progress workout open in another tab, they may expect "Add to workout" to add to that one. **Mitigation:** Copy or link to session in "Recent" so they can re-open the same workout; or document that "Add to workout" = "Start a new workout with this exercise."

3. **Unknown exercise slug shows a page instead of 404**  
   `/training/exercise/invalid-slug` renders with title from `slugToName(slug)`, no description, letter fallback. Acceptable for beta; for polish consider `if (!exercise) notFound()` so invalid URLs return 404.

4. **Browse search requires submit**  
   Query is applied on form submit (`router.push` with `q`). If the user types and navigates away without submitting, search is not applied. Expected behavior; no change required unless you want live search.

---

## 4. EXACT TEST ORDER

Run in this order so each step can assume the previous passed:

1. **Training home** — Open `/training`. Expect: hero, stats, PRs, Recent (or empty), Library (6 cards), Your exercises (or empty). Cards show images for bundled exercises or letter for others. Tap "Browse all" → browse.
2. **Browse** — Filters and search (e.g. Category: Strength, `q` = "press"). Expect: grid of cards, correct images/placeholders. Tap a card → detail.
3. **Men/women switch** — Account → Exercise images → switch to Women’s set. Back to Training: Library and Browse cards should use women’s images for the 20 bundled. Switch back to Men’s set and confirm again.
4. **Exercise detail** — Open any exercise (e.g. Bench Press). Expect: large image (or letter), description, "Add to workout", "Start with this", and Stats if data exists. Tap "Start with this".
5. **Start workout** — Expect redirect to `/training/workout/[id]?exercise=Bench%20Press`. Modal "Log set" opens with "Bench press" (or exact name) prefilled. Close modal. Confirm header shows workout and "In progress".
6. **Add exercise** — Tap "+ Add exercise". Enter another exercise (e.g. Squat), sets/reps/weight, tap Add. Expect: entry appears in list, modal closes. Tap "Edit" on that entry, change reps, Save. Expect update.
7. **Log set flow** — Add a second set (same or different exercise) via "+ Add exercise". Confirm both entries show; optional: tap Rest timer 30s, let it run to "Done".
8. **Rest timer** — On session page, tap 30s (or 60s). Expect: countdown, Stop button. Let it reach 0 → "Done" then hide. Tap 90s, then Stop → countdown stops.
9. **Mobile widths** — Resize to ~375px (or use device). Training home: 2-col grid, readable. Browse: same. Detail: image and buttons visible. Session: "Add exercise" and entry cards usable; open modal and confirm scroll if needed. Rest timer presets wrap.
10. **Placeholder behavior** — Open an exercise that has no bundled image (e.g. Running, or any not in the 20). Expect: letter fallback (e.g. "R") on card and on detail, no broken image. Switch variant; still letter if no women’s asset.

---

## 5. WHAT TO FIX FIRST IF ANY STEP FAILS

| If this step fails | Fix priority | Action |
|--------------------|--------------|--------|
| 1. Training home | P0 | Confirm `getExercisesPreview` returns 6, `getProfile` returns profile, `exercise_image_variant` is read. Check for client/server mismatch or missing RSC data. |
| 2. Browse | P0 | Confirm `getExercisesFiltered` with `category`/`muscleGroup`/`search`; ensure `searchParams` awaited; grid receives exercises and `getExerciseImageForUser` per card. |
| 3. Men/women switch | P0 | Confirm Account saves `exercise_image_variant` to profile; Training/Browse/Detail/Library all receive and pass variant; `getExerciseImageForUser` uses it. Check cache (e.g. revalidate or hard refresh). |
| 4. Exercise detail | P0 | Confirm `getExerciseBySlug(slug)`; if null, consider `notFound()`. Ensure `getExerciseImageForUser` and `ExerciseImage` with `variant="detail"` and fallback letter. |
| 5. Start workout | P0 | Confirm `createWorkoutAction` returns `id`; `router.push(ROUTES.trainingWorkout(id) + '?exercise=' + encodeURIComponent(name))`; session page reads `prefillExerciseName` and opens modal in `useEffect`. |
| 6. Add exercise | P0 | Confirm modal receives `workoutId`, `initialExerciseName`; `createExerciseEntryAction` and `revalidatePath` for workout URL; list re-renders after close. |
| 7. Log set flow | P0 | Confirm create/update entry actions; form validation (exercise name required); revalidate paths; Edit passes `entry` and updates same entry. |
| 8. Rest timer | P1 | Purely client; check `RestTimer` mount and state (secondsLeft, isRunning, showDone). If timer doesn’t start, check `start(sec)` and interval cleanup. |
| 9. Mobile | P1 | Check overflow on modals (`max-h-[90vh] overflow-y-auto` on form card); touch targets ≥44px; no horizontal scroll on body. |
| 10. Placeholder | P1 | Confirm `getExerciseImageForUser` returns `null` for non-bundled and no `image_url`; `ExerciseImage`/`ExerciseCard` render letter when `!isValidImageUrl(src)` or `onError`. |

**Rule:** Fix the failing step’s flow first (same row). Do not refactor unrelated areas. If the failure is environmental (e.g. no profile, no exercises in DB), fix data/migrations or seed, not the UI flow.
