"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bmiFromMetric,
  bmiCategory,
  bmiDescription,
  type BmiCategory,
} from "@/lib/bmi";
import { BMIGauge } from "./BMIGauge";
import { updateProfileHeightAction } from "@/app/(dashboard)/progress/actions";
import { cmToFtIn, ftInToCm, formatHeight, lbToKg } from "@/lib/units";
import type { PreferredUnits } from "@/lib/units";
import { cn } from "@/lib/utils";

function categoryAccent(cat: BmiCategory): string {
  switch (cat) {
    case "underweight":
      return "border-sky-500/30 bg-sky-500/5";
    case "normal":
      return "border-emerald-500/30 bg-emerald-500/5";
    case "overweight":
      return "border-amber-500/30 bg-amber-500/5";
    case "obese":
      return "border-red-500/30 bg-red-500/5";
    default:
      return "border-white/[0.08]";
  }
}

export function BMICalculatorCard({
  preferredUnits,
  initialHeightCm,
  latestWeightKg,
}: {
  preferredUnits: PreferredUnits;
  initialHeightCm: number | null;
  latestWeightKg: number | null;
}) {
  const router = useRouter();
  const savedRef = useRef(initialHeightCm);
  const [saving, setSaving] = useState(false);
  const [saveHint, setSaveHint] = useState<string | null>(null);

  const [heightCm, setHeightCm] = useState<number | "">(() =>
    initialHeightCm != null && Number.isFinite(initialHeightCm) ? initialHeightCm : ""
  );
  const [ftStr, setFtStr] = useState(() =>
    initialHeightCm != null && Number.isFinite(initialHeightCm)
      ? String(cmToFtIn(initialHeightCm).ft)
      : ""
  );
  const [inchStr, setInchStr] = useState(() =>
    initialHeightCm != null && Number.isFinite(initialHeightCm)
      ? String(cmToFtIn(initialHeightCm).inch)
      : ""
  );

  const [weightInput, setWeightInput] = useState<string>(() => {
    if (latestWeightKg == null || !Number.isFinite(latestWeightKg)) return "";
    if (preferredUnits === "imperial") return (latestWeightKg * 2.205).toFixed(1);
    return String(Math.round(latestWeightKg * 10) / 10);
  });

  const heightCmResolved = useMemo(() => {
    if (preferredUnits === "metric") {
      if (heightCm === "" || heightCm === null) return null;
      const n = Number(heightCm);
      return Number.isFinite(n) && n >= 50 && n <= 280 ? n : null;
    }
    const f = ftStr.trim() === "" ? NaN : Number(ftStr);
    const i = inchStr.trim() === "" ? NaN : Number(inchStr);
    if (!Number.isFinite(f) || !Number.isFinite(i) || f < 3 || f > 8) return null;
    if (i < 0 || i >= 12) return null;
    return ftInToCm(f, i);
  }, [preferredUnits, heightCm, ftStr, inchStr]);

  const weightKgResolved = useMemo(() => {
    if (weightInput.trim() === "") return null;
    const n = Number(weightInput);
    if (!Number.isFinite(n) || n <= 0) return null;
    return preferredUnits === "imperial" ? lbToKg(n) : n;
  }, [weightInput, preferredUnits]);

  const bmi = useMemo(() => {
    if (heightCmResolved == null || weightKgResolved == null) return null;
    return bmiFromMetric(weightKgResolved, heightCmResolved);
  }, [heightCmResolved, weightKgResolved]);

  const cat = bmi != null ? bmiCategory(bmi) : null;

  useEffect(() => {
    if (heightCmResolved == null) return;
    if (savedRef.current === heightCmResolved) return;
    const target = heightCmResolved;
    const t = window.setTimeout(() => {
      void (async () => {
        if (savedRef.current === target) return;
        setSaving(true);
        setSaveHint(null);
        const res = await updateProfileHeightAction(target);
        setSaving(false);
        if (res.success) {
          savedRef.current = target;
          setSaveHint("Height saved to your profile");
          router.refresh();
          window.setTimeout(() => setSaveHint(null), 3500);
        } else {
          setSaveHint(res.error);
        }
      })();
    }, 700);
    return () => window.clearTimeout(t);
  }, [heightCmResolved, router]);

  function useLatestWeight() {
    if (latestWeightKg == null || !Number.isFinite(latestWeightKg)) return;
    if (preferredUnits === "imperial") setWeightInput((latestWeightKg * 2.205).toFixed(1));
    else setWeightInput(String(Math.round(latestWeightKg * 10) / 10));
  }

  return (
    <section
      className={cn(
        "rounded-3xl border p-5 sm:p-6 shadow-xl shadow-black/25",
        cat ? categoryAccent(cat) : "border-white/[0.08] bg-zinc-900/50"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-400/90">BMI calculator</p>
          <p className="mt-1 text-sm text-zinc-400 max-w-md">
            Informational only — not medical advice. Height is saved to your profile automatically.
          </p>
        </div>
        {latestWeightKg != null && (
          <button
            type="button"
            onClick={useLatestWeight}
            className="shrink-0 rounded-2xl border border-white/[0.1] bg-black/30 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-emerald-500/30 hover:text-white transition-colors"
          >
            Use latest log weight
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Height</label>
          {preferredUnits === "metric" ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={280}
                step={0.1}
                value={heightCm === "" ? "" : heightCm}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") setHeightCm("");
                  else setHeightCm(Number(v));
                }}
                className="w-full rounded-2xl border border-white/[0.1] bg-black/30 px-4 py-3 text-lg font-semibold text-white tabular-nums"
                placeholder="cm"
              />
              <span className="text-sm text-zinc-500">cm</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <span className="text-[10px] text-zinc-500 block mb-1">ft</span>
                <input
                  type="number"
                  min={3}
                  max={8}
                  step={1}
                  value={ftStr}
                  onChange={(e) => setFtStr(e.target.value)}
                  className="w-20 rounded-2xl border border-white/[0.1] bg-black/30 px-3 py-3 text-lg font-semibold text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block mb-1">in</span>
                <input
                  type="number"
                  min={0}
                  max={11}
                  step={0.1}
                  value={inchStr}
                  onChange={(e) => setInchStr(e.target.value)}
                  className="w-20 rounded-2xl border border-white/[0.1] bg-black/30 px-3 py-3 text-lg font-semibold text-white"
                />
              </div>
            </div>
          )}
          {heightCmResolved != null && (
            <p className="text-xs text-zinc-500">
              Stored: {formatHeight(heightCmResolved, preferredUnits)}
              {saving && <span className="ml-2 text-emerald-400/90">Saving…</span>}
            </p>
          )}
          {saveHint && <p className="text-xs text-emerald-400/90">{saveHint}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Weight (for BMI)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={0.1}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-full rounded-2xl border border-white/[0.1] bg-black/30 px-4 py-3 text-lg font-semibold text-white tabular-nums"
              placeholder={preferredUnits === "imperial" ? "lb" : "kg"}
            />
            <span className="text-sm text-zinc-500">{preferredUnits === "imperial" ? "lb" : "kg"}</span>
          </div>
          <p className="text-[11px] text-zinc-600">Does not log a metric entry — only drives the calculator.</p>
        </div>
      </div>

      {bmi != null && cat != null && (
        <div className="mt-6 space-y-4 border-t border-white/[0.06] pt-6">
          <BMIGauge bmi={bmi} category={cat} />
          <p className="text-sm text-zinc-400 leading-snug max-w-md mx-auto text-center">
            {bmiDescription(cat)}
          </p>
        </div>
      )}

      {(heightCmResolved == null || weightKgResolved == null) && (
        <p className="mt-4 text-sm text-zinc-500 text-center">
          Enter height and weight to see your BMI and category.
        </p>
      )}
    </section>
  );
}
