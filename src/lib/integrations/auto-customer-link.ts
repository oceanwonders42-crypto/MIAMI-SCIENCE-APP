/**
 * Automatic WooCommerce customer linking by exact normalized email.
 * Safe, conservative, idempotent. Called from dashboard/account bootstrap when user has no mapping.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getWooCommerceConfig, fetchCustomersSearch, fetchOrdersByCustomer } from "./woocommerce-client";
import type { RawWooCustomer, RawWooOrder } from "./woocommerce-client";
import { normalizeEmail } from "@/lib/customer-mapping";
import {
  getCustomerMappingByUserId,
  getCustomerMappingByWooCustomerId,
  upsertCustomerMapping,
} from "@/lib/customer-mapping";
import { getProfile } from "@/lib/profile";
import { syncWooOrderToApp } from "./woocommerce-order-sync";

const THROTTLE_HOURS = 24;

export type AutoLinkResult =
  | { linked: true; wooCustomerId: number; ordersImported: number }
  | { linked: false; reason: "already_mapped" | "no_email" | "throttled" | "no_match" | "multiple_matches" | "woo_taken" | "config" | "error"; error?: string };

/**
 * Attempt to link the app user to a WooCommerce customer by exact normalized email.
 * Uses service role client so mapping and order writes succeed. Call only from trusted server context.
 * Idempotent: if user already has a mapping, returns immediately without calling WooCommerce.
 */
export async function tryAutoLinkCustomer(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<AutoLinkResult> {
  const normalized = normalizeEmail(userEmail);
  if (!normalized) return { linked: false, reason: "no_email" };

  const existing = await getCustomerMappingByUserId(supabase, userId);
  if (existing) return { linked: false, reason: "already_mapped" };

  const profile = await getProfile(supabase, userId);
  const now = new Date();
  const attemptedAt = profile?.last_customer_auto_link_attempt_at
    ? new Date(profile.last_customer_auto_link_attempt_at)
    : null;
  if (attemptedAt && now.getTime() - attemptedAt.getTime() < THROTTLE_HOURS * 60 * 60 * 1000) {
    return { linked: false, reason: "throttled" };
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      last_customer_auto_link_attempt_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);
  if (updateErr) {
    return { linked: false, reason: "error", error: updateErr.message };
  }

  const config = getWooCommerceConfig();
  if (!config) return { linked: false, reason: "config" };

  const searchResult = await fetchCustomersSearch(config, normalized, { per_page: 100 });
  if (!searchResult.ok) {
    return { linked: false, reason: "error", error: searchResult.error };
  }

  const list = (searchResult.data ?? []) as RawWooCustomer[];
  const exactMatches = list.filter((c) => normalizeEmail(c.email) === normalized);
  if (exactMatches.length === 0) return { linked: false, reason: "no_match" };
  if (exactMatches.length > 1) return { linked: false, reason: "multiple_matches" };

  const customer = exactMatches[0]!;
  const wooCustomerId = typeof customer.id === "number" ? customer.id : parseInt(String(customer.id), 10);
  if (Number.isNaN(wooCustomerId)) return { linked: false, reason: "error", error: "Invalid customer id" };

  const existingByWoo = await getCustomerMappingByWooCustomerId(supabase, wooCustomerId);
  if (existingByWoo && existingByWoo.user_id !== userId) {
    return { linked: false, reason: "woo_taken" };
  }

  const upsert = await upsertCustomerMapping(supabase, {
    user_id: userId,
    woo_customer_id: wooCustomerId,
    customer_email: normalized,
    match_source: "auto_email",
  });
  if (!upsert.ok) {
    return { linked: false, reason: "error", error: upsert.error };
  }

  let ordersImported = 0;
  let page = 1;
  const perPage = 50;
  while (true) {
    const ordersResult = await fetchOrdersByCustomer(config, wooCustomerId, { per_page: perPage, page });
    if (!ordersResult.ok) break;
    const orders = (ordersResult.data ?? []) as RawWooOrder[];
    if (orders.length === 0) break;
    for (const o of orders) {
      const id = o.id != null ? String(o.id) : null;
      if (!id) continue;
      const sync = await syncWooOrderToApp(supabase, id, userId);
      if (sync.ok) ordersImported++;
    }
    if (orders.length < perPage) break;
    page++;
  }

  return { linked: true, wooCustomerId, ordersImported };
}
