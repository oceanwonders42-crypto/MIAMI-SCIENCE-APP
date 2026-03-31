import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteWooCommerceCoupon,
  getWooCommerceConfig,
} from "@/lib/integrations/woocommerce-client";

const PAID_LIKE_STATUSES = new Set([
  "processing",
  "completed",
  "on-hold",
]);

/** Minimal order shape for coupon cleanup (webhook or REST order fetch). */
export type OrderCouponPayload = {
  id: string | number;
  status?: string;
  coupon_lines?: Array<{ code?: string }> | null;
};

/**
 * When a store order includes coupon codes that match app-issued reward coupons,
 * mark the redemption used and delete the Woo coupon so it cannot be reused.
 */
export async function applyRewardCouponUsageFromStoreOrder(
  supabase: SupabaseClient,
  payload: OrderCouponPayload
): Promise<void> {
  const status = String(payload.status ?? "").trim().toLowerCase();
  if (!PAID_LIKE_STATUSES.has(status)) return;

  const lines = payload.coupon_lines;
  if (!Array.isArray(lines) || lines.length === 0) return;

  const codes = lines
    .map((c) => (typeof c?.code === "string" ? c.code.trim().toUpperCase() : ""))
    .filter(Boolean);
  if (codes.length === 0) return;

  const orderExternalId = String(payload.id);
  const config = getWooCommerceConfig();

  for (const code of codes) {
    const { data: row, error } = await supabase
      .from("reward_redemptions")
      .select("id, woo_coupon_id, status")
      .eq("coupon_code", code)
      .eq("status", "issued")
      .maybeSingle();

    if (error || !row) continue;

    const now = new Date().toISOString();
    await supabase
      .from("reward_redemptions")
      .update({
        status: "used",
        used_order_external_id: orderExternalId,
        used_at: now,
      })
      .eq("id", (row as { id: string }).id);

    if (config) {
      const wooId = (row as { woo_coupon_id: number }).woo_coupon_id;
      await deleteWooCommerceCoupon(config, wooId);
    }
  }
}
