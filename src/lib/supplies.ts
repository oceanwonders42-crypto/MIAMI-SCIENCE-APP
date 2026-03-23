import type { SupabaseClient } from "@supabase/supabase-js";
import type { Supply } from "@/types";

export async function getSupplies(
  supabase: SupabaseClient,
  userId: string
): Promise<Supply[]> {
  const { data, error } = await supabase
    .from("supplies")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Supply[];
}

/**
 * Simple days-left estimate: current_count / daily_use_estimate.
 * Returns null if daily_use_estimate is missing or zero.
 */
export function getDaysLeft(supply: Supply): number | null {
  const daily = supply.daily_use_estimate;
  if (daily == null || daily <= 0) return null;
  const days = supply.current_count / daily;
  return Math.floor(days);
}

export function isLowSupply(supply: Supply): boolean {
  const threshold = supply.threshold_alert;
  if (threshold == null) return false;
  return supply.current_count <= threshold;
}

/**
 * Estimated runout date (UTC date string YYYY-MM-DD) from current_count and daily_use_estimate.
 * Returns null if daily_use_estimate is missing or zero.
 */
export function getRunoutDate(supply: Supply): string | null {
  const days = getDaysLeft(supply);
  if (days == null || days < 0) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** True when days left is 1–14 and supply is not yet at low threshold. */
export function isRunningLowSoon(supply: Supply): boolean {
  const days = getDaysLeft(supply);
  if (days == null || days <= 0) return false;
  if (isLowSupply(supply)) return false;
  return days <= 14;
}

/**
 * 0–100 for UI level bar: prefer starting_quantity vs current; else scale vs threshold.
 * Returns null when we can't infer a meaningful fill level.
 */
export function getSupplyLevelPercent(supply: Supply): number | null {
  const start = supply.starting_quantity;
  if (start != null && start > 0) {
    const pct = (supply.current_count / start) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  }
  const th = supply.threshold_alert;
  if (th != null && th >= 0) {
    const full = Math.max(th * 4, th + 1, supply.current_count);
    const pct = (supply.current_count / full) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  }
  return null;
}

export type SupplyInsert = {
  user_id: string;
  name: string;
  unit: string;
  current_count: number;
  starting_quantity?: number | null;
  threshold_alert?: number | null;
  daily_use_estimate?: number | null;
  label_strength?: string | null;
  notes?: string | null;
};

export async function createSupply(
  supabase: SupabaseClient,
  insert: SupplyInsert
): Promise<{ data: Supply | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("supplies")
    .insert({
      ...insert,
      starting_quantity: insert.starting_quantity ?? insert.current_count,
      label_strength: insert.label_strength ?? null,
    })
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as Supply, error: null };
}

export async function updateSupplyCount(
  supabase: SupabaseClient,
  supplyId: string,
  userId: string,
  current_count: number
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("supplies")
    .update({
      current_count,
      updated_at: new Date().toISOString(),
    })
    .eq("id", supplyId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export type SupplyUpdate = Partial<
  Pick<
    Supply,
    | "name"
    | "unit"
    | "current_count"
    | "starting_quantity"
    | "threshold_alert"
    | "daily_use_estimate"
    | "label_strength"
    | "notes"
  >
>;

export async function updateSupply(
  supabase: SupabaseClient,
  supplyId: string,
  userId: string,
  update: SupplyUpdate
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("supplies")
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq("id", supplyId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteSupply(
  supabase: SupabaseClient,
  supplyId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("supplies")
    .delete()
    .eq("id", supplyId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}
