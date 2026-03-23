"use client";

import { useId } from "react";
import { formatWeight, type PreferredUnits } from "@/lib/units";

interface Point {
  at: string;
  weightKg: number;
}

/**
 * Minimal SVG sparkline — weight lifted over time (chronological left → right).
 */
export function ExerciseWeightSparkline({
  title,
  points,
  preferredUnits,
}: {
  title: string;
  points: Point[];
  preferredUnits: PreferredUnits;
}) {
  const gradId = useId().replace(/:/g, "");
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/35 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
        <p className="text-sm text-zinc-500 mt-1">No weight logs yet</p>
      </div>
    );
  }

  const weights = points.map((p) => p.weightKg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const pad = 6;
  const w = 280;
  const h = 72;
  const span = maxW - minW || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((p.weightKg - minW) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${coords.join(" L ")}`;

  const last = points[points.length - 1]!;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/35 px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 truncate pr-2">
          {title}
        </p>
        <p className="text-sm font-semibold tabular-nums text-emerald-300 shrink-0">
          {formatWeight(last.weightKg, preferredUnits)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[72px] text-emerald-400/90"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(52 211 153)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(52 211 153)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`}
          fill={`url(#${gradId})`}
          className="opacity-90"
        />
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="text-[10px] text-zinc-500 mt-1">
        {points.length} log{points.length !== 1 ? "s" : ""} · last{" "}
        {new Date(last.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </p>
    </div>
  );
}
