/**
 * Historical WooCommerce backfill — import customers and orders, link to app users via customer_mappings.
 * Uses service role for order upserts and auth.admin for email→user_id lookup.
 * Matching: exact normalized email only; never by name. Idempotent.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { INTEGRATION_KEYS, upsertIntegrationSyncLog } from "@/lib/admin/integration-log";
import { getWooCommerceConfig, fetchCustomers, fetchOrders } from "./woocommerce-client";
import { normalizeEmail, upsertCustomerMapping } from "@/lib/customer-mapping";
import { compactLineItemsForMetadata } from "@/lib/order-line-items";
import { grantPurchasePointsIfEligible } from "@/lib/rewards";

const PER_PAGE = 100;

export type BackfillResult = {
  ok: true;
  customersFetched: number;
  mappingsCreated: number;
  ordersFetched: number;
  ordersUpserted: number;
  ordersMatched: number;
  ordersUnmatched: number;
  errors: string[];
};

export type BackfillOutcome = BackfillResult | { ok: false; error: string };

/**
 * Build a map of normalized email → user_id from Supabase Auth (service role).
 * Uses auth.admin.listUsers with pagination.
 */
export async function getAppUserIdsByEmail(
  supabase: SupabaseClient
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const perPage = 1000;
  let page = 1;

  const auth = supabase.auth;
  if (!auth?.admin?.listUsers) return map;

  for (;;) {
    const { data, error } = await auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) break;
    const users = (data as { users?: { id: string; email?: string }[] })?.users ?? [];
    for (const u of users) {
      const email = u.email;
      if (typeof email === "string" && email) {
        const key = normalizeEmail(email);
        if (key && !map.has(key)) map.set(key, u.id);
      }
    }
    if (users.length < perPage) break;
    page += 1;
  }
  return map;
}

/**
 * Run full backfill: fetch WC customers → create mappings by email match; fetch WC orders → upsert orders with user_id from mapping.
 */
export async function runWooCommerceBackfill(
  supabase: SupabaseClient
): Promise<BackfillOutcome> {
  const config = getWooCommerceConfig();
  if (!config) return { ok: false, error: "WooCommerce not configured" };

  const errors: string[] = [];
  let customersFetched = 0;
  let mappingsCreated = 0;
  let ordersFetched = 0;
  let ordersUpserted = 0;
  let ordersMatched = 0;
  let ordersUnmatched = 0;

  const emailToUserId = await getAppUserIdsByEmail(supabase);

  let page = 1;
  for (;;) {
    const result = await fetchCustomers(config, { per_page: PER_PAGE, page });
    if (!result.ok) {
      errors.push(`Customers fetch: ${result.error}`);
      break;
    }
    const customers = result.data;
    customersFetched += customers.length;

    for (const c of customers) {
      const email = c.email;
      if (typeof email !== "string" || !email.trim()) continue;
      const key = normalizeEmail(email);
      if (!key) continue;
      const userId = emailToUserId.get(key);
      if (!userId) continue;
      const res = await upsertCustomerMapping(supabase, {
        user_id: userId,
        woo_customer_id: c.id,
        customer_email: key,
        match_source: "imported",
      });
      if (res.ok) mappingsCreated += 1;
      else errors.push(`Mapping ${c.id}: ${res.error}`);
    }

    if (customers.length < PER_PAGE) break;
    page += 1;
  }

  const { data: mappings } = await supabase
    .from("customer_mappings")
    .select("woo_customer_id, user_id");
  const wooToUserId = new Map<number, string>();
  for (const m of mappings ?? []) {
    const row = m as { woo_customer_id: number; user_id: string };
    wooToUserId.set(row.woo_customer_id, row.user_id);
  }

  page = 1;
  for (;;) {
    const result = await fetchOrders(config, { per_page: PER_PAGE, page });
    if (!result.ok) {
      errors.push(`Orders fetch: ${result.error}`);
      break;
    }
    const orders = result.data;
    ordersFetched += orders.length;

    for (const o of orders) {
      const externalId = String(o.id);
      const wooCustomerId =
        o.customer_id != null
          ? typeof o.customer_id === "number"
            ? o.customer_id
            : parseInt(String(o.customer_id), 10)
          : null;
      const user_id =
        wooCustomerId != null && !Number.isNaN(wooCustomerId)
          ? wooToUserId.get(wooCustomerId) ?? null
          : null;
      if (user_id) ordersMatched += 1;
      else ordersUnmatched += 1;

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

      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("external_id", externalId)
        .maybeSingle();

      const row = {
        external_id: externalId,
        order_number,
        status,
        total_cents,
        currency,
        item_count,
        shop_url: config.baseUrl ? `${config.baseUrl}/my-account/orders` : null,
        user_id,
        referred_by_user_id: null as string | null,
        customer_email,
        woo_customer_id,
        created_at,
        metadata: {
          source: "woocommerce_backfill",
          ...(lineItemsMeta ? { line_items: lineItemsMeta } : {}),
        } as Record<string, unknown>,
      };

      if (existing) {
        const { error } = await supabase
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
          .eq("id", existing.id);
        if (error) errors.push(`Order ${externalId} update: ${error.message}`);
        else {
          ordersUpserted += 1;
          const points = await grantPurchasePointsIfEligible(supabase, {
            userId: row.user_id,
            orderExternalId: row.external_id,
            orderStatus: row.status,
            orderTotalCents: row.total_cents,
            orderNumber: row.order_number,
          });
          if (points.error) errors.push(`Order ${externalId} points: ${points.error.message}`);
        }
      } else {
        const { error } = await supabase.from("orders").insert({
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
        });
        if (error) errors.push(`Order ${externalId} insert: ${error.message}`);
        else {
          ordersUpserted += 1;
          const points = await grantPurchasePointsIfEligible(supabase, {
            userId: row.user_id,
            orderExternalId: row.external_id,
            orderStatus: row.status,
            orderTotalCents: row.total_cents,
            orderNumber: row.order_number,
          });
          if (points.error) errors.push(`Order ${externalId} points: ${points.error.message}`);
        }
      }
    }

    if (orders.length < PER_PAGE) break;
    page += 1;
  }

  await upsertIntegrationSyncLog(supabase, INTEGRATION_KEYS.WOOCOMMERCE_BACKFILL, {
    ok: true,
    customersFetched,
    mappingsCreated,
    ordersFetched,
    ordersUpserted,
    ordersMatched,
    ordersUnmatched,
    errorCount: errors.length,
  });

  return {
    ok: true,
    customersFetched,
    mappingsCreated,
    ordersFetched,
    ordersUpserted,
    ordersMatched,
    ordersUnmatched,
    errors,
  };
}
