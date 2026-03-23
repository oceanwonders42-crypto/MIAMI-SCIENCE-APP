"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExerciseEntryAction, updateExerciseEntryAction } from "./actions";
import { enqueuePendingExerciseEntry } from "@/lib/training/offline-queue";
import { lbToKg, weightLabel, type PreferredUnits } from "@/lib/units";
import type { WorkoutEntry } from "@/types";

function parseWeightForStorage(
  raw: string | number,
  preferredUnits: PreferredUnits
): number | null {
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return preferredUnits === "imperial" ? lbToKg(n) : n;
}

function initialWeightField(
  entry: WorkoutEntry | undefined,
  preferredUnits: PreferredUnits
): string | number {
  if (entry == null || entry.weight == null) return "";
  if (preferredUnits === "imperial") {
    return Math.round(entry.weight * 2.205 * 10) / 10;
  }
  return entry.weight;
}

interface ExerciseEntryFormProps {
  workoutId: string;
  entry?: WorkoutEntry | null;
  onClose: () => void;
  /** Pre-fill exercise name when adding (e.g. from "Add to workout" on exercise detail). */
  initialExerciseName?: string | null;
  preferredUnits?: PreferredUnits;
  /** Called after a successful new log (online or queued offline). */
  onLogged?: (exerciseName: string) => void;
}

export function ExerciseEntryForm({
  workoutId,
  entry,
  onClose,
  initialExerciseName,
  preferredUnits = "metric",
  onLogged,
}: ExerciseEntryFormProps) {
  const router = useRouter();
  const isEdit = !!entry;
  const [form, setForm] = useState({
    exercise_name: entry?.exercise_name ?? initialExerciseName ?? "",
    sets: entry?.sets ?? ("" as string | number),
    reps: entry?.reps ?? ("" as string | number),
    weight: initialWeightField(entry ?? undefined, preferredUnits),
    notes: entry?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = form.exercise_name.trim();
    if (!name) {
      setError("Exercise name is required.");
      return;
    }
    const sets = form.sets === "" ? null : Number(form.sets);
    const reps = form.reps === "" ? null : Number(form.reps);
    const weightKg = parseWeightForStorage(form.weight, preferredUnits);
    const notesTrim = form.notes.trim() || null;

    if (isEdit) {
      setLoading(true);
      const result = await updateExerciseEntryAction(workoutId, entry!.id, {
        exercise_name: name,
        sets,
        reps,
        weight: weightKg,
        notes: notesTrim,
      });
      setLoading(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => onClose(), 1200);
      return;
    }

    const offline =
      typeof navigator !== "undefined" && typeof window !== "undefined" && !navigator.onLine;

    if (offline) {
      enqueuePendingExerciseEntry(workoutId, {
        exercise_name: name,
        sets,
        reps,
        weight: weightKg,
        notes: notesTrim,
      });
      setSaved(true);
      onLogged?.(name);
      router.refresh();
      setTimeout(() => onClose(), 800);
      return;
    }

    setLoading(true);
    const result = await createExerciseEntryAction(workoutId, {
      exercise_name: name,
      sets,
      reps,
      weight: weightKg,
      notes: notesTrim,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSaved(true);
    onLogged?.(name);
    router.refresh();
    setTimeout(() => onClose(), 1200);
  }

  if (saved) {
    return (
      <div className="w-full max-w-md rounded-[1.25rem] border border-emerald-500/25 bg-gradient-to-br from-zinc-900 to-emerald-950/20 p-8 text-center shadow-xl">
        <p className="text-emerald-400 font-semibold text-lg">Saved</p>
        <p className="text-zinc-400 text-sm mt-1">Closing…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-[1.25rem] border border-white/[0.08] bg-gradient-to-br from-zinc-900 via-zinc-900 to-teal-950/25 shadow-xl overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-zinc-100 text-lg">{isEdit ? "Edit" : "Log set"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 rounded-2xl p-2.5 min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation active:opacity-80"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Exercise</label>
            <input
              type="text"
              value={form.exercise_name}
              onChange={(e) => setForm((p) => ({ ...p, exercise_name: e.target.value }))}
              required
              className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3.5 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[52px]"
              placeholder="e.g. Bench press"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Sets</label>
              <input
                type="number"
                min={0}
                value={form.sets}
                onChange={(e) => setForm((p) => ({ ...p, sets: e.target.value }))}
                className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.05] px-2 py-3.5 text-center text-xl font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[52px]"
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Reps</label>
              <input
                type="number"
                min={0}
                value={form.reps}
                onChange={(e) => setForm((p) => ({ ...p, reps: e.target.value }))}
                className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.05] px-2 py-3.5 text-center text-xl font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[52px]"
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                {weightLabel(preferredUnits).replace(/^Weight\s*\((.+)\)$/, "$1")}
              </label>
              <input
                type="number"
                min={0}
                step={preferredUnits === "imperial" ? 0.5 : 0.5}
                value={form.weight}
                onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.05] px-2 py-3.5 text-center text-xl font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[52px]"
                placeholder="—"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[48px]"
              placeholder="Optional"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-semibold text-zinc-200 min-h-[52px] touch-manipulation active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-4 text-base font-bold disabled:opacity-50 min-h-[52px] touch-manipulation active:scale-[0.98]"
            >
              {loading ? "Saving…" : isEdit ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
