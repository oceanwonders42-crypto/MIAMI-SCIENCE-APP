"use client";

import { useState } from "react";
import { createSavedPlan } from "@/lib/training/saved-plans";
import type { WorkoutEntry } from "@/types";

export function SaveWorkoutPlanDialog({
  entries,
  onClose,
}: {
  entries: WorkoutEntry[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const seen = new Set<string>();
  const orderedNames: string[] = [];
  for (const e of entries) {
    const t = e.exercise_name.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    orderedNames.push(t);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim() || "My plan";
    createSavedPlan(n, orderedNames);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mst-saved-plans-changed"));
    }
    setSaved(true);
    setTimeout(onClose, 900);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md rounded-[1.25rem] border border-white/[0.08] bg-zinc-900 p-5 shadow-xl">
        {saved ? (
          <p className="text-center text-emerald-400 font-semibold py-6">Plan saved</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-lg font-semibold text-zinc-50">Save as plan</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 p-2 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              {orderedNames.length} exercise{orderedNames.length !== 1 ? "s" : ""} in order
            </p>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Plan name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Push day"
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 text-sm font-bold"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
