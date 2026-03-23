import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import {
  getExerciseBySlug,
  slugToName,
  getExerciseImageForUser,
  getRelatedExercises,
  formatDifficultyLabel,
} from "@/lib/exercises";
import { getExerciseLogsByName, getExercisePRs } from "@/lib/exercise-history";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/lib/constants";
import { AddToWorkoutButton } from "../../AddToWorkoutButton";
import { ExerciseImage } from "../../ExerciseImage";
import type { ExerciseDifficulty } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function difficultyBadgeClass(d: ExerciseDifficulty | null | undefined): string {
  if (d === "beginner") {
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  }
  if (d === "intermediate") {
    return "bg-amber-500/20 text-amber-200 border-amber-500/35";
  }
  if (d === "advanced") {
    return "bg-orange-500/20 text-orange-200 border-orange-500/35";
  }
  return "bg-zinc-700/80 text-zinc-300 border-zinc-600";
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [exercise, profile] = await Promise.all([
    getExerciseBySlug(supabase, slug),
    getProfile(supabase, userId),
  ]);
  const name = exercise?.name ?? slugToName(slug);
  const [logs, prs, related] = await Promise.all([
    getExerciseLogsByName(supabase, userId, name, 10),
    getExercisePRs(supabase, userId),
    getRelatedExercises(supabase, exercise?.muscle_group ?? null, slug, 4),
  ]);
  const exerciseImageVariant = profile?.exercise_image_variant === "women" ? "women" : "men";
  const resolvedImageUrl = getExerciseImageForUser(
    { slug, image_url: exercise?.image_url ?? null },
    exerciseImageVariant
  );
  const pr = prs.find(
    (p) => p.exerciseName.trim().toLowerCase() === name.trim().toLowerCase()
  );

  const hasMeta = exercise?.category || exercise?.muscle_group;
  const subtitle = hasMeta ? [exercise?.category, exercise?.muscle_group].filter(Boolean).join(" · ") : "Exercise";

  const steps = exercise?.steps?.filter(Boolean) ?? [];
  const formTips = exercise?.form_tips?.filter(Boolean) ?? [];
  const mistakes = exercise?.common_mistakes?.filter(Boolean) ?? [];
  const primaryMuscles = exercise?.primary_muscles?.filter(Boolean) ?? [];
  const secondaryMuscles = exercise?.secondary_muscles?.filter(Boolean) ?? [];
  const equipment = exercise?.equipment?.filter(Boolean) ?? [];
  const diffLabel = formatDifficultyLabel(exercise?.difficulty ?? null);

  const fallbackDescription =
    exercise?.description?.trim() ||
    "Log sets, reps, and weight as you perform this exercise. Track consistently to see progress over time.";

  return (
    <>
      <Header title={name} subtitle={subtitle} backHref={ROUTES.training} />
      <div className="px-4 md:px-6 pb-10 space-y-6">
        {/* Full-width hero */}
        <section className="-mx-4 md:-mx-6">
          <div className="relative w-full aspect-[16/10] max-h-[min(52vh,480px)] bg-gradient-to-br from-zinc-800 to-zinc-950">
            <ExerciseImage
              src={resolvedImageUrl}
              slug={slug}
              fallbackLetter={name}
              variant="detail"
              category={exercise?.category ?? null}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
          </div>
        </section>

        <div className="space-y-4 -mt-2">
          <div className="flex flex-wrap items-center gap-2">
            {diffLabel && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyBadgeClass(exercise?.difficulty)}`}
              >
                {diffLabel}
              </span>
            )}
            {equipment.map((eq) => (
              <span
                key={eq}
                className="inline-flex items-center rounded-full border border-zinc-600 bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-200"
              >
                {eq}
              </span>
            ))}
            {!diffLabel && equipment.length === 0 && (
              <span className="text-xs text-zinc-500">Add equipment and difficulty in the library admin.</span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <AddToWorkoutButton exerciseName={name} variant="add" />
            <AddToWorkoutButton exerciseName={name} variant="start" />
          </div>
        </div>

        {steps.length > 0 ? (
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">How to do it</h2>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i}>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/10">
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-600/20 text-sm font-bold text-primary-300">
                        {i + 1}
                      </span>
                      <p className="text-sm text-zinc-200 leading-relaxed pt-0.5">{step}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Overview</h2>
            <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{fallbackDescription}</p>
          </section>
        )}

        {formTips.length > 0 && (
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <h2 className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wider mb-2">Key form tips</h2>
            <ul className="space-y-2">
              {formTips.map((tip, i) => (
                <li key={i} className="text-sm text-emerald-100/95 flex gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {mistakes.length > 0 && (
          <section className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4">
            <h2 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">Common mistakes</h2>
            <ul className="space-y-2">
              {mistakes.map((m, i) => (
                <li key={i} className="text-sm text-amber-100/90 flex gap-2">
                  <span className="text-amber-400 mt-0.5">!</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Muscles worked</h2>
            {primaryMuscles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-emerald-400/90 mb-2">Primary</p>
                <ul className="flex flex-wrap gap-2">
                  {primaryMuscles.map((m) => (
                    <li
                      key={m}
                      className="rounded-full bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 text-sm font-medium text-emerald-200"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {secondaryMuscles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">Secondary</p>
                <ul className="flex flex-wrap gap-2">
                  {secondaryMuscles.map((m) => (
                    <li
                      key={m}
                      className="rounded-full bg-zinc-800/80 border border-zinc-700 px-3 py-1 text-sm text-zinc-400"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {(pr || logs.length > 0) && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Your stats</h3>
            {pr && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <p className="text-lg font-bold text-emerald-400 tabular-nums">{pr.maxWeight} kg PR</p>
              </div>
            )}
            {logs.length > 0 && (
              <ul className="space-y-2">
                {logs.map((log, i) => {
                  const parts = [
                    log.sets != null && `${log.sets}×`,
                    log.reps != null && log.reps,
                    log.weight != null && `${log.weight} kg`,
                  ].filter(Boolean);
                  return (
                    <li
                      key={`${log.workoutId}-${i}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-300 font-medium tabular-nums">
                        {parts.length ? parts.join(" ") : "—"}
                      </span>
                      <Link
                        href={ROUTES.trainingWorkout(log.workoutId)}
                        className="text-primary-400 font-medium touch-manipulation"
                      >
                        {new Date(log.lastLoggedAt).toLocaleDateString()}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {related.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Related exercises
              {exercise?.muscle_group ? (
                <span className="text-zinc-600 font-normal normal-case"> · {exercise.muscle_group}</span>
              ) : null}
            </h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={ROUTES.trainingExercise(r.slug)}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm font-medium text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900/70 transition-colors touch-manipulation"
                  >
                    <span>{r.name}</span>
                    <span className="text-zinc-500 text-xs">View</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
