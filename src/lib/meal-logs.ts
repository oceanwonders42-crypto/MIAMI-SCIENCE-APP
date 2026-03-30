import type { SupabaseClient } from "@supabase/supabase-js";
import type { MealLog } from "@/types/database";

export type ListMealLogsResult = {
  logs: MealLog[];
  /** Query failed (e.g. missing migration, RLS)—do not treat as empty history */
  loadError: boolean;
};

export async function listMealLogs(
  supabase: SupabaseClient,
  userId: string,
  limit = 60
): Promise<ListMealLogsResult> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) return { logs: [], loadError: true };
  return { logs: (data ?? []) as MealLog[], loadError: false };
}
