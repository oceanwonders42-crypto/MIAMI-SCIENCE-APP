"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutAction } from "./actions";
import { ROUTES, WORKOUT_TYPES } from "@/lib/constants";
import { weightLabel } from "@/lib/units";
import type { PreferredUnits } from "@/lib/units";

interface WorkoutFormProps {
  preferredUnits?: PreferredUnits;
}

export function WorkoutForm({ preferredUnits = "metric" }: WorkoutFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState({
    started_at: today,
    workout_type: "Strength",
    duration_minutes: "" as string | number,
    bodyweight_kg: "" as string | number,
    energy_score: "" as string | number,
    recovery_score: "" as string | number,
    notes: "",
  });

  async function quickStartSession() {
    setError(null);
    setLoading(true);
    const result = await createWorkoutAction({
      started_at: new Date().toISOString(),
      workout_type: "Strength",
      name: "Strength",
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.push(ROUTES.trainingWorkout(result.id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createWorkoutAction({
      started_at: new Date(form.started_at).toISOString(),
      workout_type: form.workout_type || null,
      name: form.workout_type || null,
      duration_minutes:
        form.duration_minutes === "" ? null : Number(form.duration_minutes),
      bodyweight_kg:
        form.bodyweight_kg === ""
          ? null
          : preferredUnits === "imperial"
            ? Number(form.bodyweight_kg) / 2.205
            : Number(form.bodyweight_kg),
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
    setOpen(false);
    setForm({
      started_at: new Date().toISOString().slice(0, 16),
      workout_type: "Strength",
      duration_minutes: "",
      bodyweight_kg: "",
      energy_score: "",
      recovery_score: "",
      notes: "",
    });
    router.push(ROUTES.trainingWorkout(result.id));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-5 text-sm min-h-[44px] shadow-md shadow-emerald-500/20 touch-manipulation active:scale-[0.98]"
      >
        Log workout
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[1.25rem] border border-white/[0.08] bg-gradient-to-br from-zinc-900 via-zinc-900 to-teal-950/30 shadow-2xl">
            <div className="flex flex-row items-center justify-between p-5 pb-2 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-zinc-50">Log workout</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xl leading-none p-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-5 pt-4 space-y-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => void quickStartSession()}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 text-sm disabled:opacity-50 touch-manipulation active:scale-[0.99]"
              >
                {loading ? "Starting…" : "Quick start — empty session"}
              </button>
              <p className="text-[11px] text-center text-zinc-500 uppercase tracking-wider">or add details</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm p-3">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Date & time</label>
                  <input
                    type="datetime-local"
                    value={form.started_at}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, started_at: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Workout type</label>
                  <select
                    value={form.workout_type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, workout_type: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                  >
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, duration_minutes: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    {weightLabel(preferredUnits)}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.bodyweight_kg}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bodyweight_kg: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                    placeholder="Optional"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Energy (1–10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.energy_score}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, energy_score: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Recovery (1–10)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={form.recovery_score}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, recovery_score: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                    placeholder="Optional"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 text-sm disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Start session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
