"use client";

import { cn } from "@/lib/utils";

export function SupplyLevelBar({
  percent,
  low,
}: {
  percent: number | null;
  low?: boolean;
}) {
  if (percent == null) {
    return (
      <p className="text-[11px] text-zinc-500">
        Set starting quantity or alert threshold to see level
      </p>
    );
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-[11px] text-zinc-500">
        <span>Supply left</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div
        className="h-2.5 rounded-full bg-white/[0.08] overflow-hidden border border-white/[0.05]"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            low ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
          )}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
