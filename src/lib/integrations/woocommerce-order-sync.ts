/**
 * Sync a single WooCommerce order into the app orders table.
 * Used after in-app checkout so the order appears on the Orders page immediately.
 * Same backend as website; no duplicate order system.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getWooCommerceConfig, fetchOrderById } from "./woocommerce-client";
import type { RawWooOrder } from "./woocommerce-client";
import { compactLineItemsForMetadata } from "@/lib/order-line-items";
import { applyRewardCouponUsageFromStoreOrder } from "@/lib/reward-coupon-lifecycle";
import { grantPurchasePointsIfEligible } from "@/lib/rewards";

export type SyncOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

/**
 * Fetch order from WooCommerce and upsert into app orders. Uses provided user_id for ownership.
 * Call with service role client so RLS allows insert.
 */
export async function syncWooOrderToApp(
  supabase: SupabaseClient,
  wooOrderId: string,
  userId: string
): Promise<SyncOrderResult> {
  const config = getWooCommerceConfig();
  if (!config) return { ok: false, error: "WooCommerce not configured" };

  const result = await fetchOrderById(config, wooOrderId);
  if (!result.ok) return { ok: false, error: result.error };
  const o = result.data as RawWooOrder;

  const externalId = String(o.id);
  const wooCustomerId =
    o.customer_id != null
      ? typeof o.customer_id === "number"
        ? o.customer_id
        : parseInt(String(o.customer_id), 10)
      : null;
  const total = o.total != null ? parseFloat(String(o.total).replace(/,/g, "")) : NaN;
  const total_cents = !Number.isNaN(total) ? Math.round(total * 100) : null;
  const order_number = o.number != null ? String(o.number) : externalId;
  const status = typeof o.status === "string" ? o.status : "pending";
  const currency = typeof o.currency === "string" ? o.currency : "USD";
  const created_at =
    typeof o.date_created === "string" ? o.date_created : new Date().toISOString();
  const line_items = o.line_items ?? [];
  const item_count = Array.isArray(line_items) ? line_items.length : 0;
  const lineItemsMeta = compactLineItemsForMetadata(line_items);
  const customer_email =
    typeof o.billing?.email === "string" && o.billing.email.trim()
      ? o.billing.email.trim()
      : null;
  const woo_customer_id =
    wooCustomerId != null && !Number.isNaN(wooCustomerId) ? wooCustomerId : null;

  const row = {
    external_id: externalId,
    order_number,
    status,
    total_cents,
    currency,
    item_count,
    shop_url: config.baseUrl ? `${config.baseUrl}/my-account/orders` : null,
    user_id: userId,
    referred_by_user_id: null as string | null,
    customer_email,
    woo_customer_id,
    created_at,
    metadata: {
      source: "app_checkout",
      ...(lineItemsMeta ? { line_items: lineItemsMeta } : {}),
    } as Record<string, unknown>,
  };

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("external_id", externalId)
    .maybeSingle();

  if (existing) {
    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        order_number: row.order_number,
        status: row.status,
        total_cents: row.total_cents,
        currency: row.currency,
        item_count: row.item_count,
        shop_url: row.shop_url,
        user_id: row.user_id,
        customer_email: row.customer_email,
        woo_customer_id: row.woo_customer_id,
        metadata: row.metadata,
      })
      .eq("id", (existing as { id: string }).id)
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    await grantPurchasePointsIfEligible(supabase, {
      userId: row.user_id,
      orderExternalId: row.external_id,
      orderStatus: row.status,
      orderTotalCents: row.total_cents,
      orderNumber: row.order_number,
    });
    await applyRewardCouponUsageFromStoreOrder(supabase, {
      id: o.id,
      status: row.status,
      coupon_lines: o.coupon_lines ?? null,
    });
    return { ok: true, orderId: (updated as { id: string }).id };
  }

  const { data: inserted, error } = await supabase
    .from("orders")
    .insert({
      external_id: row.external_id,
      order_number: row.order_number,
      status: row.status,
      total_cents: row.total_cents,
      currency: row.currency,
      item_count: row.item_count,
      shop_url: row.shop_url,
      user_id: row.user_id,
      referred_by_user_id: row.referred_by_user_id,
      customer_email: row.customer_email,
      woo_customer_id: row.woo_customer_id,
      created_at: row.created_at,
      metadata: row.metadata,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  await grantPurchasePointsIfEligible(supabase, {
    userId: row.user_id,
    orderExternalId: row.external_id,
    orderStatus: row.status,
    orderTotalCents: row.total_cents,
    orderNumber: row.order_number,
  });
  await applyRewardCouponUsageFromStoreOrder(supabase, {
    id: o.id,
    status: row.status,
    coupon_lines: o.coupon_lines ?? null,
  });
  return { ok: true, orderId: (inserted as { id: string }).id };
}
