import type { SupabaseClient } from "@supabase/supabase-js";
import type { BodyMetric } from "@/types";
import { MEASUREMENT_KEYS, type MeasurementKey } from "@/lib/progress-constants";

export async function getBodyMetrics(
  supabase: SupabaseClient,
  userId: string,
  limit = 30
): Promise<BodyMetric[]> {
  const { data, error } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as BodyMetric[];
}

/**
 * Newest value per measurement key (metrics ordered newest-first).
 */
export function latestMeasurementsPerKey(
  metrics: BodyMetric[]
): Partial<Record<MeasurementKey, number>> {
  const out: Partial<Record<MeasurementKey, number>> = {};
  let filled = 0;
  for (const m of metrics) {
    const meas = m.measurements;
    if (!meas || typeof meas !== "object") continue;
    for (const k of MEASUREMENT_KEYS) {
      if (out[k] != null) continue;
      const raw = meas[k];
      if (raw != null && Number(raw) > 0) {
        out[k] = Number(raw);
        filled += 1;
      }
    }
    if (filled >= MEASUREMENT_KEYS.length) break;
  }
  return out;
}

export type BodyMetricInsert = {
  user_id: string;
  recorded_at: string;
  weight_kg?: number | null;
  body_fat_percent?: number | null;
  measurements?: Record<string, number> | null;
};

export async function createBodyMetric(
  supabase: SupabaseClient,
  insert: BodyMetricInsert
): Promise<{ data: BodyMetric | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("body_metrics")
    .insert(insert)
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as BodyMetric, error: null };
}

export async function deleteBodyMetric(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("body_metrics")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

/** Simple trend: first (oldest) and last (newest) weight in the list, and count. */
export function getBodyweightTrendSummary(metrics: BodyMetric[]): {
  count: number;
  firstWeight: number | null;
  firstDate: string | null;
  lastWeight: number | null;
  lastDate: string | null;
  delta: number | null;
} {
  const withWeight = metrics.filter((m) => m.weight_kg != null && Number(m.weight_kg) > 0);
  if (withWeight.length === 0) {
    return { count: 0, firstWeight: null, firstDate: null, lastWeight: null, lastDate: null, delta: null };
  }
  const sorted = [...withWeight].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const fw = Number(first.weight_kg);
  const lw = Number(last.weight_kg);
  return {
    count: withWeight.length,
    firstWeight: fw,
    firstDate: first.recorded_at,
    lastWeight: lw,
    lastDate: last.recorded_at,
    delta: first.id !== last.id ? lw - fw : null,
  };
}

/** Change from previous log to latest log (kg). Null if fewer than 2 weight entries. */
export function getLastTwoWeightDeltaKg(metrics: BodyMetric[]): number | null {
  const withW = metrics
    .filter((m) => m.weight_kg != null && Number(m.weight_kg) > 0)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  if (withW.length < 2) return null;
  const prev = Number(withW[withW.length - 2]!.weight_kg);
  const last = Number(withW[withW.length - 1]!.weight_kg);
  return last - prev;
}
