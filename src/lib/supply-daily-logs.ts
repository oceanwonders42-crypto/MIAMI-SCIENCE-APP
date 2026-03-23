import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "supply_daily_logs";

export interface SupplyDailyLogRow {
  id: string;
  user_id: string;
  supply_id: string;
  log_date: string;
  taken: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Supply IDs marked taken for the given calendar date (YYYY-MM-DD).
 */
export async function getTakenSupplyIdsForDate(
  supabase: SupabaseClient,
  userId: string,
  logDate: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("supply_id")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .eq("taken", true);
  if (error || !data?.length) return [];
  return (data as { supply_id: string }[]).map((r) => r.supply_id);
}

export async function upsertSupplyDailyTaken(
  supabase: SupabaseClient,
  userId: string,
  supplyId: string,
  logDate: string,
  taken: boolean
): Promise<{ error: Error | null }> {
  const { data: existing, error: selErr } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("supply_id", supplyId)
    .eq("log_date", logDate)
    .maybeSingle();
  if (selErr) return { error: new Error(selErr.message) };
  const now = new Date().toISOString();
  if (existing && typeof (existing as { id: string }).id === "string") {
    const { error } = await supabase
      .from(TABLE)
      .update({ taken, updated_at: now })
      .eq("id", (existing as { id: string }).id);
    return { error: error ? new Error(error.message) : null };
  }
  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    supply_id: supplyId,
    log_date: logDate,
    taken,
    updated_at: now,
  });
  return { error: error ? new Error(error.message) : null };
}
