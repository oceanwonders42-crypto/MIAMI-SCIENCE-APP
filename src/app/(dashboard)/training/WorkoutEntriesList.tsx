"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteExerciseEntryAction } from "./actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExerciseEntryForm } from "./ExerciseEntryForm";
import { isPRWeight } from "@/lib/exercise-history";
import {
  getPendingForWorkout,
  isOfflineQueuedEntryId,
  pendingEntryToWorkoutEntry,
  removePendingByClientId,
} from "@/lib/training/offline-queue";
import { formatWeight, type PreferredUnits } from "@/lib/units";
import { getExerciseImageContextForName } from "@/lib/exercises";
import { ExercisePhotoThumb } from "@/components/exercises/ExercisePhotoThumb";
import type { WorkoutEntry } from "@/types";
import type { Exercise } from "@/types";
import type { ExerciseImageVariant } from "@/types";
import type { ExercisePR } from "@/lib/exercise-history";

interface WorkoutEntriesListProps {
  workoutId: string;
  entries: WorkoutEntry[];
  prs: ExercisePR[];
  /** In session layout the parent shows the main "Add exercise" CTA. */
  layout?: "inline" | "session";
  preferredUnits?: PreferredUnits;
  /** When set with variant, show a thumbnail per entry (library lookup by exercise name). */
  exerciseLibrary?: Exercise[];
  exerciseImageVariant?: ExerciseImageVariant;
}

export function WorkoutEntriesList({
  workoutId,
  entries,
  prs,
  layout = "inline",
  preferredUnits = "metric",
  exerciseLibrary,
  exerciseImageVariant,
}: WorkoutEntriesListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkoutEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkoutEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [queueTick, setQueueTick] = useState(0);
  const isSession = layout === "session";
  const showExerciseThumb =
    exerciseLibrary != null &&
    exerciseLibrary.length > 0 &&
    exerciseImageVariant != null;

  const refreshLocal = useCallback(() => setQueueTick((t) => t + 1), []);

  useEffect(() => {
    const onQ = () => refreshLocal();
    window.addEventListener("mst-offline-queue-changed", onQ);
    window.addEventListener("mst-workout-entries-synced", onQ);
    return () => {
      window.removeEventListener("mst-offline-queue-changed", onQ);
      window.removeEventListener("mst-workout-entries-synced", onQ);
    };
  }, [refreshLocal]);

  const mergedEntries = useMemo(() => {
    if (typeof window === "undefined") {
      return entries;
    }
    const pending = getPendingForWorkout(workoutId).map(pendingEntryToWorkoutEntry);
    void queueTick;
    return [...entries, ...pending];
  }, [entries, workoutId, queueTick]);

  async function handleDelete(entry: WorkoutEntry) {
    if (isOfflineQueuedEntryId(entry.id)) {
      removePendingByClientId(entry.id);
      setDeleteConfirm(null);
      refreshLocal();
      router.refresh();
      return;
    }
    setLoading(true);
    const result = await deleteExerciseEntryAction(workoutId, entry.id);
    setLoading(false);
    if (result.success) {
      setDeleteConfirm(null);
      router.refresh();
    }
  }

  return (
    <>
      <div
        className={
          isSession
            ? "space-y-3"
            : "mt-2 pl-2 border-l-2 border-zinc-700 space-y-2"
        }
      >
        {mergedEntries.length === 0 && isSession ? (
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 py-12 px-4 text-center">
            <p className="text-zinc-500 text-sm">No exercises yet. Tap + Add exercise above.</p>
          </div>
        ) : (
          mergedEntries.map((e) => {
            const offline = isOfflineQueuedEntryId(e.id);
            const setLine = [
              e.sets != null && `${e.sets}×`,
              e.reps != null && e.reps,
              e.weight != null && `@ ${formatWeight(e.weight, preferredUnits)}`,
            ]
              .filter(Boolean)
              .join(" ");
            const imgCtx =
              showExerciseThumb && exerciseLibrary && exerciseImageVariant
                ? getExerciseImageContextForName(e.exercise_name, exerciseLibrary, exerciseImageVariant)
                : null;
            return (
              <div
                key={e.id}
                className={
                  isSession
                    ? "rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 space-y-3"
                    : "flex flex-wrap items-center justify-between gap-2 text-sm"
                }
              >
                <div
                  className={
                    isSession
                      ? "flex gap-3 min-w-0"
                      : "flex flex-wrap items-center gap-2 min-w-0"
                  }
                >
                  {imgCtx && (
                    <ExercisePhotoThumb
                      slug={imgCtx.slug}
                      imageUrl={imgCtx.imageUrl}
                      category={imgCtx.category}
                      className={isSession ? "h-14 w-14" : "h-10 w-10"}
                    />
                  )}
                  <div className={isSession ? "min-w-0 flex-1 space-y-1" : "min-w-0"}>
                  <span className="font-semibold text-zinc-100">{e.exercise_name}</span>
                  {offline && (
                    <Badge variant="outline" className="text-amber-200/90 border-amber-500/30 bg-amber-500/10">
                      Offline
                    </Badge>
                  )}
                  {isSession && setLine ? (
                    <p className="text-zinc-400 text-sm font-medium tabular-nums">{setLine}</p>
                  ) : (
                    !isSession &&
                    (e.sets != null || e.reps != null || e.weight != null) && (
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {[
                          e.sets != null && `${e.sets}×`,
                          e.reps != null && e.reps,
                          e.weight != null && formatWeight(e.weight, preferredUnits),
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    )
                  )}
                  {!offline && isPRWeight(e.exercise_name, e.weight, prs) && (
                    <Badge variant="success" className={isSession ? "mt-1" : ""}>
                      PR
                    </Badge>
                  )}
                  </div>
                </div>
                {isSession && (
                  <div className="flex gap-2">
                    {!offline && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEntry(e);
                          setShowForm(false);
                        }}
                        className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 font-semibold py-3 px-4 min-h-[48px] touch-manipulation active:scale-[0.98]"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(e)}
                      className="rounded-2xl border border-white/10 bg-white/5 hover:bg-red-500/10 text-red-400 font-semibold py-3 px-4 min-h-[48px] touch-manipulation active:scale-[0.98]"
                    >
                      Delete
                    </button>
                  </div>
                )}
                {!isSession && (
                  <div className="flex gap-2 flex-shrink-0">
                    {!offline && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEntry(e);
                          setShowForm(false);
                        }}
                        className="text-emerald-500 text-sm hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(e)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        {!isSession && (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setEditingEntry(null);
            }}
            className="text-sm font-medium text-emerald-500 hover:underline"
          >
            + Add exercise
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <ExerciseEntryForm
            workoutId={workoutId}
            preferredUnits={preferredUnits}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <ExerciseEntryForm
            workoutId={workoutId}
            entry={editingEntry}
            preferredUnits={preferredUnits}
            onClose={() => setEditingEntry(null)}
          />
        </div>
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card className="w-full max-w-sm p-5 border-white/[0.08] bg-zinc-900">
            <p className="text-sm text-zinc-300 mb-5">
              Delete &quot;{deleteConfirm.exercise_name}&quot;?
              {isOfflineQueuedEntryId(deleteConfirm.id) && (
                <span className="block text-xs text-amber-200/80 mt-2">Removes unsynced log only.</span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-semibold text-zinc-100 min-h-[48px] touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
                className="flex-1 rounded-2xl bg-red-600 hover:bg-red-500 text-white py-3.5 text-sm font-semibold disabled:opacity-50 min-h-[48px] touch-manipulation"
              >
                {loading ? "…" : "Delete"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
