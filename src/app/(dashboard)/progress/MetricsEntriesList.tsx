"use client";

import { useRouter } from "next/navigation";
import { deleteBodyMetricAction } from "./actions";
import { formatWeight, formatHeight } from "@/lib/units";
import type { BodyMetric } from "@/types";
import type { PreferredUnits } from "@/lib/units";
import { MEASUREMENT_KEYS, MEASUREMENT_LABELS } from "@/lib/progress-constants";

interface MetricsEntriesListProps {
  metrics: BodyMetric[];
  preferredUnits?: PreferredUnits;
}

export function MetricsEntriesList({ metrics, preferredUnits = "metric" }: MetricsEntriesListProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const result = await deleteBodyMetricAction(id);
    if (result.success) router.refresh();
  }

  if (metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-black/20 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-zinc-300">Your metrics story starts with one log</p>
        <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
          Add weight, body fat, or measurements — each entry builds charts and shows how you&apos;re trending over
          time.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {metrics.map((m) => {
        const parts: string[] = [];
        if (m.weight_kg != null && Number(m.weight_kg) > 0) {
          parts.push(formatWeight(m.weight_kg, preferredUnits));
        }
        if (m.body_fat_percent != null && Number.isFinite(Number(m.body_fat_percent))) {
          parts.push(`${Number(m.body_fat_percent).toFixed(1)}% fat`);
        }
        const meas = m.measurements;
        if (meas && typeof meas === "object") {
          for (const k of MEASUREMENT_KEYS) {
            const v = meas[k];
            if (v != null && Number(v) > 0) {
              parts.push(
                `${MEASUREMENT_LABELS[k]} ${formatHeight(Number(v), preferredUnits)}`
              );
            }
          }
        }
        return (
          <li
            key={m.id}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 flex flex-wrap items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">
                {new Date(m.recorded_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-zinc-200 mt-1">
                {parts.length > 0 ? parts.join(" · ") : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(m.id)}
              className="text-xs font-semibold text-red-400 hover:text-red-300 shrink-0 touch-manipulation py-1"
            >
              Delete
            </button>
          </li>
        );
      })}
    </ul>
  );
}
