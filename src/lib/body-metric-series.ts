import type { BodyMetric } from "@/types";
import type { MeasurementKey } from "@/lib/progress-constants";

export interface SeriesPoint {
  at: string;
  value: number;
}

/** Chronological order for charts (oldest → newest). */
export function metricsChronological(metrics: BodyMetric[]): BodyMetric[] {
  return [...metrics].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
}

export function weightSeriesKg(metrics: BodyMetric[]): SeriesPoint[] {
  return metricsChronological(metrics)
    .filter((m) => m.weight_kg != null && Number(m.weight_kg) > 0)
    .map((m) => ({ at: m.recorded_at, value: Number(m.weight_kg) }));
}

export function bodyFatSeries(metrics: BodyMetric[]): SeriesPoint[] {
  return metricsChronological(metrics)
    .filter((m) => m.body_fat_percent != null && Number.isFinite(Number(m.body_fat_percent)))
    .map((m) => ({ at: m.recorded_at, value: Number(m.body_fat_percent) }));
}

export function measurementSeriesCm(metrics: BodyMetric[], key: MeasurementKey): SeriesPoint[] {
  return metricsChronological(metrics)
    .map((m) => {
      const raw = m.measurements?.[key];
      const v = raw != null ? Number(raw) : NaN;
      return Number.isFinite(v) && v > 0 ? { at: m.recorded_at, value: v } : null;
    })
    .filter((p): p is SeriesPoint => p != null);
}
