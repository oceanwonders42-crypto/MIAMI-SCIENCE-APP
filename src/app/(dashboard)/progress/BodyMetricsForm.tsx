"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBodyMetricAction } from "./actions";
import { weightLabel } from "@/lib/units";
import { inToCm, lbToKg } from "@/lib/units";
import type { PreferredUnits } from "@/lib/units";

interface BodyMetricsFormProps {
  preferredUnits?: PreferredUnits;
}

function lengthLabel(units: PreferredUnits, part: string) {
  return units === "imperial" ? `${part} (in)` : `${part} (cm)`;
}

export function BodyMetricsForm({ preferredUnits = "metric" }: BodyMetricsFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState({
    recorded_at: today,
    weight: "",
    body_fat: "",
    chest: "",
    waist: "",
    hips: "",
    arm: "",
    leg: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const wRaw = form.weight === "" ? null : Number(form.weight);
    const bfRaw = form.body_fat === "" ? null : Number(form.body_fat);
    const toCm = (raw: string) => {
      if (raw === "") return null;
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) return null;
      return preferredUnits === "imperial" ? inToCm(n) : n;
    };
    const measurements: Record<string, number> = {};
    const c = toCm(form.chest);
    const wa = toCm(form.waist);
    const h = toCm(form.hips);
    const ar = toCm(form.arm);
    const le = toCm(form.leg);
    if (c != null) measurements.chest_cm = c;
    if (wa != null) measurements.waist_cm = wa;
    if (h != null) measurements.hips_cm = h;
    if (ar != null) measurements.arm_cm = ar;
    if (le != null) measurements.leg_cm = le;

    const weight_kg =
      wRaw == null
        ? null
        : preferredUnits === "imperial"
          ? lbToKg(wRaw)
          : wRaw;

    if (
      weight_kg == null &&
      bfRaw == null &&
      Object.keys(measurements).length === 0
    ) {
      setError("Add at least weight, body fat, or one measurement.");
      return;
    }

    setLoading(true);
    const result = await createBodyMetricAction({
      recorded_at: new Date(form.recorded_at).toISOString(),
      weight_kg,
      body_fat_percent: bfRaw,
      measurements: Object.keys(measurements).length ? measurements : null,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setForm({
      recorded_at: new Date().toISOString().slice(0, 16),
      weight: "",
      body_fat: "",
      chest: "",
      waist: "",
      hips: "",
      arm: "",
      leg: "",
    });
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-5 text-sm min-h-[44px] shadow-md shadow-emerald-900/25 touch-manipulation active:scale-[0.98]"
      >
        Log metrics
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 overflow-y-auto">
          <div className="w-full max-w-md my-6 rounded-[1.25rem] border border-white/[0.08] bg-gradient-to-br from-zinc-900 via-zinc-900 to-teal-950/25 shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-white/[0.06]">
              <h3 className="font-bold text-zinc-50">Log body metrics</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xl p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Date & time</label>
                <input
                  type="datetime-local"
                  value={form.recorded_at}
                  onChange={(e) => setForm((p) => ({ ...p, recorded_at: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    {weightLabel(preferredUnits)}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.weight}
                    onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                    placeholder="—"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Body fat %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.body_fat}
                    onChange={(e) => setForm((p) => ({ ...p, body_fat: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                    placeholder="—"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider pt-1">Measurements</p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["chest", "Chest"],
                    ["waist", "Waist"],
                    ["hips", "Hips"],
                    ["arm", "Arms"],
                    ["leg", "Legs"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      {lengthLabel(preferredUnits, label)}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500">
                For informational self-tracking only — not medical advice.
              </p>
              <div className="flex gap-2 pt-2 sticky bottom-0 bg-zinc-900/95 pb-1">
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
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 text-sm font-bold disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
