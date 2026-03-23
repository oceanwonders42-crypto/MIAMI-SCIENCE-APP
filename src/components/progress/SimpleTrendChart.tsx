"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface TrendPoint {
  at: string;
  value: number;
}

/**
 * Lightweight SVG line chart (oldest → newest). Motivating, not busy.
 */
export function SimpleTrendChart({
  title,
  points,
  valueLabel,
  accent = "emerald",
}: {
  title: string;
  points: TrendPoint[];
  /** e.g. "182 lb" for latest */
  valueLabel: string;
  accent?: "emerald" | "teal";
}) {
  const gradId = useId().replace(/:/g, "");
  if (points.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/40 px-5 py-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{title}</p>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          No data yet — log a few entries and your trend line will appear here.
        </p>
      </div>
    );
  }

  const vals = points.map((p) => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const pad = 6;
  const w = 280;
  const h = 80;
  const span = maxV - minV || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((p.value - minV) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${coords.join(" L ")}`;
  const last = points[points.length - 1]!;

  return (
    <div className="chart-reveal rounded-3xl border border-white/[0.08] bg-zinc-900/45 px-4 py-4 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 truncate pr-2">
          {title}
        </p>
        <p
          className={cn(
            "text-sm font-semibold tabular-nums shrink-0",
            accent === "teal" ? "text-teal-300" : "text-emerald-300"
          )}
        >
          {valueLabel}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={cn(
          "w-full h-[80px]",
          accent === "teal" ? "text-teal-400/90" : "text-emerald-400/90"
        )}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={accent === "teal" ? "rgb(45 212 191)" : "rgb(52 211 153)"}
              stopOpacity="0.35"
            />
            <stop
              offset="100%"
              stopColor={accent === "teal" ? "rgb(45 212 191)" : "rgb(52 211 153)"}
              stopOpacity="0"
            />
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
