"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkoutEntriesList } from "../WorkoutEntriesList";
import { ExerciseEntryForm } from "../ExerciseEntryForm";
import { ExercisePickerModal } from "../ExercisePickerModal";
import { RestTimer } from "./RestTimer";
import { SaveWorkoutPlanDialog } from "@/components/training/SaveWorkoutPlanDialog";
import { consumePlanExerciseQueue } from "@/lib/training/saved-plans";
import { getPendingForWorkout, pendingEntryToWorkoutEntry } from "@/lib/training/offline-queue";
import type { PreferredUnits } from "@/lib/units";
import type { Workout } from "@/types";
import type { WorkoutEntry } from "@/types";
import type { Exercise } from "@/types";
import type { ExercisePR } from "@/lib/exercise-history";
import type { ExerciseImageVariant } from "@/types";

interface WorkoutSessionContentProps {
  workout: Workout;
  entries: WorkoutEntry[];
  prs: ExercisePR[];
  prefillExerciseName: string | null;
  exercises: Exercise[];
  exerciseImageVariant: ExerciseImageVariant;
  preferredUnits?: PreferredUnits;
}

export function WorkoutSessionContent({
  workout,
  entries,
  prs,
  prefillExerciseName,
  exercises,
  exerciseImageVariant,
  preferredUnits = "metric",
}: WorkoutSessionContentProps) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSavePlan, setShowSavePlan] = useState(false);
  const [initialExerciseName, setInitialExerciseName] = useState<string | null>(null);
  const [planQueue, setPlanQueue] = useState<string[]>([]);
  const [mergeTick, setMergeTick] = useState(0);

  const bumpMerge = useCallback(() => setMergeTick((t) => t + 1), []);

  useEffect(() => {
    const q = consumePlanExerciseQueue();
    if (q.length) setPlanQueue(q);
  }, []);

  useEffect(() => {
    const onQ = () => bumpMerge();
    window.addEventListener("mst-offline-queue-changed", onQ);
    window.addEventListener("mst-workout-entries-synced", onQ);
    return () => {
      window.removeEventListener("mst-offline-queue-changed", onQ);
      window.removeEventListener("mst-workout-entries-synced", onQ);
    };
  }, [bumpMerge]);

  useEffect(() => {
    if (prefillExerciseName?.trim()) {
      setInitialExerciseName(prefillExerciseName.trim());
      setShowAddForm(true);
    }
  }, [prefillExerciseName]);

  const entriesForPlan = useMemo(() => {
    if (typeof window === "undefined") return entries;
    const pending = getPendingForWorkout(workout.id).map(pendingEntryToWorkoutEntry);
    void mergeTick;
    return [...entries, ...pending];
  }, [entries, workout.id, mergeTick]);

  const mergedCount = useMemo(() => {
    const pendingLen =
      typeof window !== "undefined" ? getPendingForWorkout(workout.id).length : 0;
    void mergeTick;
    return entries.length + pendingLen;
  }, [entries.length, workout.id, mergeTick]);

  function handleCloseForm() {
    setShowAddForm(false);
    setInitialExerciseName(null);
    router.refresh();
  }

  function handlePickExercise(name: string) {
    setInitialExerciseName(name);
    setShowPicker(false);
    setShowAddForm(true);
  }

  function handleEntryLogged(exerciseName: string) {
    setPlanQueue((q) => {
      if (!q.length) return q;
      if (q[0]!.trim().toLowerCase() === exerciseName.trim().toLowerCase()) {
        return q.slice(1);
      }
      return q;
    });
  }

  function addNextFromPlan() {
    const [first, ...rest] = planQueue;
    if (!first) return;
    setPlanQueue(rest);
    setInitialExerciseName(first);
    setShowAddForm(true);
  }

  const workoutLabel = workout.workout_type ?? workout.name ?? "Workout";
  const dateLabel = new Date(workout.started_at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const summaryParts = [
    `${mergedCount} exercise${mergedCount !== 1 ? "s" : ""}`,
    workout.duration_minutes != null && `${workout.duration_minutes} min`,
  ].filter(Boolean) as string[];

  return (
    <div className="px-4 md:px-6 pb-28">
      <section className="mb-4 rounded-[1.25rem] border border-white/[0.08] bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/35 p-4 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">{workoutLabel}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">{dateLabel}</p>
          </div>
          <span className="rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold px-2.5 py-1 border border-emerald-500/25">
            In progress
          </span>
        </div>
        {summaryParts.length > 0 && (
          <p className="text-xs text-zinc-500 mt-2 tabular-nums">{summaryParts.join(" · ")}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => setShowSavePlan(true)}
            disabled={entriesForPlan.length === 0}
            className="rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-100 text-xs font-semibold px-3 py-2 disabled:opacity-40"
          >
            Save as plan
          </button>
        </div>
      </section>

      {planQueue.length > 0 && (
        <section className="mb-4 rounded-[1.25rem] border border-emerald-500/20 bg-emerald-950/15 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400/90 mb-2">
            From plan
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {planQueue.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="rounded-lg bg-black/25 text-zinc-300 text-xs px-2 py-1 border border-white/5"
              >
                {name}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={addNextFromPlan}
            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 px-4 text-base shadow-lg shadow-emerald-500/20 min-h-[52px] touch-manipulation active:scale-[0.98]"
          >
            Next: {planQueue[0]}
          </button>
        </section>
      )}

      <section className="mb-4">
        <RestTimer />
      </section>

      <section className="mb-6">
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-5 px-4 text-lg shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] min-h-[60px] touch-manipulation"
        >
          + Add exercise
        </button>
        {prefillExerciseName && (
          <button
            type="button"
            onClick={() => {
              setInitialExerciseName(prefillExerciseName.trim());
              setShowAddForm(true);
            }}
            className="w-full mt-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 font-semibold py-4 px-4 text-base hover:bg-emerald-500/15 transition-all min-h-[52px] touch-manipulation active:scale-[0.98]"
          >
            Add &quot;{prefillExerciseName}&quot;
          </button>
        )}
      </section>

      <section>
        <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.16em] mb-3">
          Exercises
        </h3>
        <WorkoutEntriesList
          workoutId={workout.id}
          entries={entries}
          prs={prs}
          layout="session"
          preferredUnits={preferredUnits}
          exerciseLibrary={exercises}
          exerciseImageVariant={exerciseImageVariant}
        />
      </section>

      {showPicker && (
        <ExercisePickerModal
          exercises={exercises}
          exerciseImageVariant={exerciseImageVariant}
          onSelect={handlePickExercise}
          onClose={() => setShowPicker(false)}
          onTypeNameInstead={() => {
            setShowPicker(false);
            setInitialExerciseName(null);
            setShowAddForm(true);
          }}
        />
      )}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <ExerciseEntryForm
            workoutId={workout.id}
            onClose={handleCloseForm}
            initialExerciseName={initialExerciseName}
            preferredUnits={preferredUnits}
            onLogged={handleEntryLogged}
          />
        </div>
      )}
      {showSavePlan && (
        <SaveWorkoutPlanDialog entries={entriesForPlan} onClose={() => setShowSavePlan(false)} />
      )}
    </div>
  );
}
