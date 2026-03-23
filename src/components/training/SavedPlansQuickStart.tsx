"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutAction } from "@/app/(dashboard)/training/actions";
import {
  listSavedPlans,
  type SavedWorkoutPlan,
  setPlanExerciseQueue,
} from "@/lib/training/saved-plans";
import { ROUTES } from "@/lib/constants";
import {
  getExerciseImageContextForName,
  type ExerciseImageLookupRow,
} from "@/lib/exercises";
import { ExercisePhotoThumb } from "@/components/exercises/ExercisePhotoThumb";
import type { ExerciseImageVariant } from "@/types";

export type ExerciseLookupRow = ExerciseImageLookupRow;

/**
 * One-tap start from locally saved templates (exercise name queue).
 */
export function SavedPlansQuickStart({
  exerciseLookup = [],
  exerciseImageVariant = "men",
}: {
  exerciseLookup?: ExerciseLookupRow[];
  exerciseImageVariant?: ExerciseImageVariant;
} = {}) {
  const router = useRouter();
  const [plans, setPlans] = useState<SavedWorkoutPlan[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setPlans(listSavedPlans());
    refresh();
    window.addEventListener("mst-saved-plans-changed", refresh);
    return () => window.removeEventListener("mst-saved-plans-changed", refresh);
  }, []);

  async function startPlan(plan: SavedWorkoutPlan) {
    setError(null);
    setLoadingId(plan.id);
    setPlanExerciseQueue([...plan.exercises]);
    const now = new Date().toISOString();
    const result = await createWorkoutAction({
      started_at: now,
      workout_type: plan.name,
      name: plan.name,
      duration_minutes: null,
      bodyweight_kg: null,
      energy_score: null,
      recovery_score: null,
      notes: null,
    });
    setLoadingId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(ROUTES.trainingWorkout(result.id));
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-white/[0.06] border-dashed bg-zinc-900/25 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Saved plans
        </p>
        <p className="text-sm text-zinc-500 mt-1">
          Save a routine from any workout session to quick-start next time.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 px-0.5">
        Quick start
      </p>
      {error && (
        <p className="text-xs text-red-400 px-0.5">{error}</p>
      )}
      <div className="flex flex-col gap-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            disabled={loadingId != null}
            onClick={() => void startPlan(plan)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-zinc-900/45 px-4 py-3.5 text-left hover:bg-zinc-900/70 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <div className="min-w-0 flex items-center gap-3">
              {exerciseLookup.length > 0 && plan.exercises.length > 0 && (
                <div className="flex shrink-0 -space-x-2" aria-hidden>
                  {plan.exercises.slice(0, 4).map((name, i) => {
                    const ctx = getExerciseImageContextForName(
                      name,
                      exerciseLookup,
                      exerciseImageVariant
                    );
                    return (
                      <div
                        key={`${plan.id}-${i}-${name}`}
                        className="ring-2 ring-zinc-900 rounded-lg overflow-hidden"
                      >
                        <ExercisePhotoThumb
                          slug={ctx.slug}
                          imageUrl={ctx.imageUrl}
                          category={ctx.category}
                          className="h-9 w-9"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-zinc-100 truncate">{plan.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {plan.exercises.length} exercise{plan.exercises.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-2">
              {loadingId === plan.id ? "…" : "Start"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
