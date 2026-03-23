import type { SupabaseClient } from "@supabase/supabase-js";

/** Known `integration_sync_log.integration` keys (single row per key). */
export const INTEGRATION_KEYS = {
  NOTIFICATIONS_CRON: "notifications_cron",
  STORE_ORDER_WEBHOOK: "store_order_webhook",
  WOOCOMMERCE_PRODUCTS: "woocommerce_products",
  WOOCOMMERCE_BACKFILL: "woocommerce_backfill",
  SHIPSTATION_SHIPMENTS: "shipstation_shipments",
} as const;

export async function upsertIntegrationSyncLog(
  supabase: SupabaseClient,
  integration: string,
  summary: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("integration_sync_log").upsert(
    {
      integration,
      last_run_at: new Date().toISOString(),
      summary,
    },
    { onConflict: "integration" }
  );
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[integration_sync_log]", integration, error.message);
  }
}
