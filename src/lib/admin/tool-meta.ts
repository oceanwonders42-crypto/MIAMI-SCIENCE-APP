import type { SupabaseClient } from "@supabase/supabase-js";
import { INTEGRATION_KEYS } from "@/lib/admin/integration-log";

export async function getProductSyncToolMeta(supabase: SupabaseClient): Promise<{
  lastRunAt: string | null;
  summary: Record<string, unknown> | null;
  productCount: number;
}> {
  const [{ data: row }, { count }] = await Promise.all([
    supabase
      .from("integration_sync_log")
      .select("last_run_at, summary")
      .eq("integration", INTEGRATION_KEYS.WOOCOMMERCE_PRODUCTS)
      .maybeSingle(),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);
  const r = row as { last_run_at: string; summary: Record<string, unknown> } | null;
  return {
    lastRunAt: r?.last_run_at ?? null,
    summary: r?.summary ?? null,
    productCount: count ?? 0,
  };
}

export async function getBackfillToolMeta(supabase: SupabaseClient): Promise<{
  lastRunAt: string | null;
  summary: Record<string, unknown> | null;
}> {
  const { data: row } = await supabase
    .from("integration_sync_log")
    .select("last_run_at, summary")
    .eq("integration", INTEGRATION_KEYS.WOOCOMMERCE_BACKFILL)
    .maybeSingle();
  const r = row as { last_run_at: string; summary: Record<string, unknown> } | null;
  return {
    lastRunAt: r?.last_run_at ?? null,
    summary: r?.summary ?? null,
  };
}

export async function getMappingToolMeta(supabase: SupabaseClient): Promise<{
  mappingsCount: number;
  unmatchedOrders: number;
}> {
  const [m, u] = await Promise.all([
    supabase.from("customer_mappings").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).is("user_id", null),
  ]);
  return {
    mappingsCount: m.count ?? 0,
    unmatchedOrders: u.count ?? 0,
  };
}
