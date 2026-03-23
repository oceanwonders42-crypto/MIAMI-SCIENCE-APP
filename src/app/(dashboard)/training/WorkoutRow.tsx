"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWorkoutAction, deleteWorkoutAction } from "./actions";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WorkoutEntriesList } from "./WorkoutEntriesList";
import { WORKOUT_TYPES } from "@/lib/constants";
import type { Workout } from "@/types";
import type { WorkoutEntry } from "@/types";
import type { ExercisePR } from "@/lib/exercise-history";

interface WorkoutRowProps {
  workout: Workout;
  entries: WorkoutEntry[];
  prs: ExercisePR[];
}

export function WorkoutRow({ workout, entries, prs }: WorkoutRowProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toDatetimeLocal = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
  };
  const [form, setForm] = useState({
    started_at: toDatetimeLocal(workout.started_at),
    workout_type: workout.workout_type ?? "Strength",
    duration_minutes: workout.duration_minutes ?? "",
    bodyweight_kg: workout.bodyweight_kg ?? "",
    energy_score: workout.energy_score ?? "",
    recovery_score: workout.recovery_score ?? "",
    notes: workout.notes ?? "",
  });

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await updateWorkoutAction(workout.id, {
      started_at: new Date(form.started_at).toISOString(),
      workout_type: form.workout_type || null,
      name: form.workout_type || null,
      duration_minutes:
        form.duration_minutes === "" ? null : Number(form.duration_minutes),
      bodyweight_kg:
        form.bodyweight_kg === "" ? null : Number(form.bodyweight_kg),
      energy_score:
        form.energy_score === ""
          ? null
          : Math.min(10, Math.max(1, Number(form.energy_score))),
      recovery_score:
        form.recovery_score === ""
          ? null
          : Math.min(10, Math.max(1, Number(form.recovery_score))),
      notes: form.notes.trim() || null,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteWorkoutAction(workout.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDeleteConfirm(false);
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardContent className="py-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {workout.workout_type ?? workout.name ?? "Workout"}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                {new Date(workout.started_at).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                {expanded ? "Hide" : "Show"} exercises ({entries.length})
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {workout.duration_minutes != null && (
                <Badge variant="outline">{workout.duration_minutes} min</Badge>
              )}
              {workout.bodyweight_kg != null && (
                <Badge variant="outline">{workout.bodyweight_kg} kg</Badge>
              )}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
          {expanded && entries.length > 0 && (
            <WorkoutEntriesList workoutId={workout.id} entries={entries} prs={prs} />
          )}
          {expanded && entries.length === 0 && (
            <WorkoutEntriesList workoutId={workout.id} entries={[]} prs={prs} />
          )}
        </CardContent>
      </Card>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="font-semibold">Edit workout</h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleUpdate} className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Date & time</label>
                  <input
                    type="datetime-local"
                    value={form.started_at}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, started_at: e.target.value }))
                    }
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Workout type</label>
                  <select
                    value={form.workout_type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, workout_type: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, duration_minutes: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bodyweight (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.bodyweight_kg}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bodyweight_kg: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-sm text-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white py-2 text-sm disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-sm p-4">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
              Delete this workout? This cannot be undone.
            </p>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-sm text-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm disabled:opacity-50"
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
