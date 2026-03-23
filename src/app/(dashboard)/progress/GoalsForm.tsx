"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProgressGoalsAction } from "./actions";
import { formatWeight } from "@/lib/units";
import { lbToKg } from "@/lib/units";
import type { PreferredUnits } from "@/lib/units";

interface GoalsFormProps {
  preferredUnits: PreferredUnits;
  goalWeightKg: number | null;
  goalBodyFat: number | null;
}

export function GoalsForm({ preferredUnits, goalWeightKg, goalBodyFat }: GoalsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const displayWeight =
    goalWeightKg != null && preferredUnits === "imperial"
      ? (goalWeightKg * 2.205).toFixed(1)
      : goalWeightKg != null
        ? String(goalWeightKg)
        : "";
  const [w, setW] = useState(displayWeight);
  const [bf, setBf] = useState(goalBodyFat != null ? String(goalBodyFat) : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const wRaw = w.trim() === "" ? null : Number(w);
    const bfRaw = bf.trim() === "" ? null : Number(bf);
    if (wRaw != null && (Number.isNaN(wRaw) || wRaw < 0)) {
      setError("Invalid goal weight.");
      return;
    }
    if (bfRaw != null && (Number.isNaN(bfRaw) || bfRaw < 0 || bfRaw > 100)) {
      setError("Body fat goal must be 0–100%.");
      return;
    }
    const goal_weight_kg =
      wRaw == null ? null : preferredUnits === "imperial" ? lbToKg(wRaw) : wRaw;
    setLoading(true);
    const res = await updateProgressGoalsAction({
      goal_weight_kg,
      goal_body_fat_percent: bfRaw,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Goals saved.</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-zinc-500 mb-1">
            Goal weight ({preferredUnits === "imperial" ? "lb" : "kg"})
          </label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={w}
            onChange={(e) => setW(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-zinc-100"
            placeholder="—"
          />
        </div>
        <div>
          <label className="block text-[11px] text-zinc-500 mb-1">Goal body fat %</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={bf}
            onChange={(e) => setBf(e.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-zinc-100"
            placeholder="—"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 text-sm font-semibold py-2.5 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save goals"}
      </button>
      {goalWeightKg != null && (
        <p className="text-[10px] text-zinc-500">
          Current goal: {formatWeight(goalWeightKg, preferredUnits)}
          {goalBodyFat != null && ` · ${goalBodyFat}% body fat`}
        </p>
      )}
    </form>
  );
}
