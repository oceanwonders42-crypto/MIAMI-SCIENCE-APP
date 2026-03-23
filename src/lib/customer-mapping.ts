/**
 * Customer mapping — safe link between app users and WooCommerce customers.
 *
 * Matching priority (explicit only; never match by name):
 * 1. tracker_user_id from payload (valid UUID) — direct from store
 * 2. woo_customer_id → customer_mappings → user_id
 * 3. customer_email → customer_mappings (normalized) → user_id, only when already mapped
 *
 * We do not auto-link on email alone from webhook; email matching is used only when
 * a mapping already exists (e.g. from backfill or manual link). Backfill creates
 * mappings by matching WC customer email to app user email (exact normalized match).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerMapping, CustomerMappingMatchSource } from "@/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalize email for safe comparison: lowercase, trim. No name or other fields. */
export function normalizeEmail(email: string | null | undefined): string {
  if (email == null || typeof email !== "string") return "";
  return email.toLowerCase().trim();
}

/** Compare two emails for equality using normalized form. */
export function emailsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeEmail(a);
  const nb = normalizeEmail(b);
  return na.length > 0 && na === nb;
}

export async function getCustomerMappingByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<CustomerMapping | null> {
  const { data, error } = await supabase
    .from("customer_mappings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return data as CustomerMapping | null;
}

export async function getCustomerMappingByWooCustomerId(
  supabase: SupabaseClient,
  wooCustomerId: number
): Promise<CustomerMapping | null> {
  const { data, error } = await supabase
    .from("customer_mappings")
    .select("*")
    .eq("woo_customer_id", wooCustomerId)
    .maybeSingle();
  if (error) return null;
  return data as CustomerMapping | null;
}

/** Get mapping by normalized customer email (for admin inspect). */
export async function getCustomerMappingByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<CustomerMapping | null> {
  const key = normalizeEmail(email);
  if (!key) return null;
  const { data, error } = await supabase
    .from("customer_mappings")
    .select("*")
    .eq("customer_email", key)
    .maybeSingle();
  if (error) return null;
  return data as CustomerMapping | null;
}

/**
 * Resolve app user_id for a WooCommerce customer. Safe: only from existing mapping.
 * Priority: mapping by woo_customer_id. Do not infer from email alone here.
 */
export async function getUserIdForWooCustomer(
  supabase: SupabaseClient,
  wooCustomerId: number
): Promise<string | null> {
  const mapping = await getCustomerMappingByWooCustomerId(supabase, wooCustomerId);
  return mapping?.user_id ?? null;
}

/**
 * Resolve app user_id for a WooCommerce order (webhook or backfill).
 * Priority: 1) tracker_user_id (valid UUID), 2) mapping by customer_id, 3) never email-only from payload.
 */
export async function resolveUserIdForOrder(
  supabase: SupabaseClient,
  payload: {
    tracker_user_id?: string | null;
    customer_id?: string | number | null;
    customer_email?: string | null;
    meta_data?: Array<{ key: string; value: string | number }> | null;
  }
): Promise<string | null> {
  const fromTracker =
    (typeof payload.tracker_user_id === "string" && UUID_REGEX.test(payload.tracker_user_id)
      ? payload.tracker_user_id
      : null) ??
    getMetaValue(payload.meta_data ?? null, "tracker_user_id");
  if (fromTracker && UUID_REGEX.test(fromTracker)) return fromTracker;

  const wooId =
    payload.customer_id != null
      ? typeof payload.customer_id === "number"
        ? payload.customer_id
        : parseInt(String(payload.customer_id), 10)
      : null;
  if (wooId != null && !Number.isNaN(wooId)) {
    const fromMapping = await getUserIdForWooCustomer(supabase, wooId);
    if (fromMapping) return fromMapping;
  }

  return null;
}

function getMetaValue(
  meta_data: Array<{ key: string; value: string | number }> | null,
  key: string
): string | null {
  if (!Array.isArray(meta_data)) return null;
  const item = meta_data.find((m) => m?.key === key);
  if (item == null || item.value == null) return null;
  return String(item.value);
}

/**
 * Create or update customer mapping. Use from backfill or admin only (service role).
 * Enforces one mapping per user and per woo_customer_id.
 */
export async function upsertCustomerMapping(
  supabase: SupabaseClient,
  input: {
    user_id: string;
    woo_customer_id: number;
    customer_email: string;
    match_source: CustomerMappingMatchSource;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normalizeEmail(input.customer_email);
  if (!email) return { ok: false, error: "customer_email required" };
  const { error } = await supabase.from("customer_mappings").upsert(
    {
      user_id: input.user_id,
      woo_customer_id: input.woo_customer_id,
      customer_email: email,
      match_source: input.match_source,
      matched_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
