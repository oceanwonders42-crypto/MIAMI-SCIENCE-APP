"use client";

import { bmiGaugePosition, bmiLabel } from "@/lib/bmi";
import type { BmiCategory } from "@/lib/bmi";

const CAT_TEXT: Record<BmiCategory, string> = {
  underweight: "text-sky-400",
  normal: "text-emerald-400",
  overweight: "text-amber-400",
  obese: "text-red-400",
};

/**
 * Color-coded horizontal BMI scale (15–40): blue → green → yellow → red.
 * Marker shows current BMI; category label below the bar.
 */
export function BMIGauge({ bmi, category }: { bmi: number; category: BmiCategory }) {
  const pos = bmiGaugePosition(bmi);
  const catClass = CAT_TEXT[category];

  return (
    <div className="space-y-3">
      <div className="relative rounded-full pt-1">
        <div className="flex h-3.5 w-full overflow-hidden rounded-full shadow-inner shadow-black/50 ring-1 ring-white/[0.06]">
          {/* Proportional bands on 15–40 scale — blue / green / yellow / red */}
          <div className="h-full bg-sky-500" style={{ flex: 3.5 }} title="Underweight" />
          <div className="h-full bg-emerald-500" style={{ flex: 6.5 }} title="Normal" />
          <div className="h-full bg-amber-400" style={{ flex: 5 }} title="Overweight" />
          <div className="h-full bg-red-500" style={{ flex: 10 }} title="Obese" />
        </div>
        <div
          className="absolute -top-0.5 h-6 w-1 rounded-full bg-white shadow-lg ring-2 ring-zinc-950 transition-all duration-300"
          style={{ left: `calc(${pos * 100}% - 2px)` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between px-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
        <span className="text-sky-500">15</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span className="text-red-500/90">40</span>
      </div>
      <p className="text-center text-lg font-black tabular-nums tracking-tight text-white">
        {bmi.toFixed(1)}{" "}
        <span className="text-sm font-bold text-zinc-500">BMI</span>
      </p>
      <p className={`text-center text-sm font-bold tracking-wide ${catClass}`}>{bmiLabel(category)}</p>
    </div>
  );
}
