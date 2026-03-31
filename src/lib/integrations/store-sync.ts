/**
 * Store sync boundary — WooCommerce/API webhooks from Droplet-hosted store (mia-science.com).
 * The tracker app remains separate; the store pushes events to this app (e.g. order created,
 * referral attributed). Do not implement live outbound API calls to the store until
 * credentials and integration utilities are in place.
 *
 * Contract:
 * - Incoming: webhook payloads (order created/updated, optional referral) → validate → upsert orders / referred_by_user_id.
 * - No hardcoded store API keys or live fetch to the store from here.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getStoreBaseUrl, isStoreSyncEnabled } from "./store-config";
import { resolveUserIdForOrder } from "@/lib/customer-mapping";
import {
  attributeStoreOrderReferralIfNeeded,
  applyStoreReferralAttributedPayload,
} from "@/lib/integrations/referral-order-attribution";
import { compactLineItemsForMetadata } from "@/lib/order-line-items";
import { grantPurchasePointsIfEligible } from "@/lib/rewards";

/** Minimal shape for an order payload from the store (e.g. WooCommerce order webhook). */
export interface StoreOrderPayload {
  id: string | number;
  number?: string;
  status: string;
  total?: number | string;
  currency?: string;
  /** Tracker app user_id (UUID). When present, link order to this user. */
  referred_by_user_id?: string | null;
  /** Optional: store customer identifier. Future: map via customer-mapping (store_customer_id). */
  customer_id?: string | number | null;
  /** Optional: customer email. Future: map via customer-mapping when CUSTOMER_MAPPING_BY_EMAIL_ENABLED. */
  customer_email?: string | null;
  /** Billing object (e.g. billing.email from WooCommerce). */
  billing?: { email?: string } | null;
  /** Tracker app user_id when store sends it (e.g. via meta_data or custom field). */
  tracker_user_id?: string | null;
  date_created?: string;
  date_modified?: string;
  created_at?: string;
  updated_at?: string;
  shop_url?: string | null;
  item_count?: number | null;
  line_items?: unknown[] | null;
  meta_data?: Array<{ key: string; value: string | number }> | null;
  /** WooCommerce coupon lines */
  coupon_lines?: Array<{ code?: string }> | null;
  order_number?: string | number | null;
  [key: string]: unknown;
}

/** Result of processing a store webhook. */
export type StoreWebhookResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export type StoreShipmentWebhookResult =
  | { ok: true; shipmentId: string }
  | { ok: false; error: string };

export interface ProcessStoreOrderWebhookOptions {
  supabase: SupabaseClient;
  /** Caller verifies signature before calling; this layer does not verify. */
  rawBody?: string;
  signature?: string | null;
}

/** Minimal shape for a shipment payload from the store (e.g. WooCommerce shipment/tracking webhook). */
export interface StoreShipmentPayload {
  /** Store shipment id (optional). When present, used for idempotent upsert. */
  id?: string | number | null;
  /** Store order id (required) — links to orders.external_id. */
  order_id: string | number;
  /** Alternative key for order; same as order_id if only one is sent. */
  order_external_id?: string | number | null;
  carrier?: string | null;
  tracking_number?: string | null;
  status: string;
  shipped_at?: string | null;
  estimated_delivery?: string | null;
  estimated_delivery_at?: string | null;
  delivered_at?: string | null;
  [key: string]: unknown;
}

export interface ProcessStoreShipmentWebhookOptions {
  supabase: SupabaseClient;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseTotal(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && !Number.isNaN(value)) {
    return Math.round(value * 100);
  }
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/,/g, ""));
    if (!Number.isNaN(n)) return Math.round(n * 100);
  }
  return null;
}

function getMetaValue(meta_data: StoreOrderPayload["meta_data"], key: string): string | null {
  if (!Array.isArray(meta_data)) return null;
  const item = meta_data.find((m) => m?.key === key);
  if (item == null || item.value == null) return null;
  return String(item.value);
}

function parseOrderPayload(p: unknown): StoreOrderPayload | null {
  if (p == null || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  if (o.id == null) return null;
  return p as StoreOrderPayload;
}

/**
 * Map webhook payload to order row for upsert.
 * user_id is resolved asynchronously via resolveUserIdForOrder (tracker_user_id or customer_mappings).
 */
function mapPayloadToOrderRow(
  payload: StoreOrderPayload,
  user_id: string | null,
  existingMetadata: Record<string, unknown> | null
): Record<string, unknown> {
  const referred_by =
    payload.referred_by_user_id != null
      ? (typeof payload.referred_by_user_id === "string" && UUID_REGEX.test(payload.referred_by_user_id)
          ? payload.referred_by_user_id
          : null)
      : getMetaValue(payload.meta_data ?? null, "referred_by_user_id");
  const referred_by_user_id =
    referred_by && UUID_REGEX.test(referred_by) ? referred_by : null;

  const external_id = String(payload.id);
  const order_number =
    payload.number != null
      ? String(payload.number)
      : payload.order_number != null
        ? String(payload.order_number)
        : external_id;
  const total_cents = parseTotal(payload.total);
  const currency =
    typeof payload.currency === "string" && payload.currency
      ? payload.currency
      : "USD";
  const created_at =
    payload.date_created ?? payload.created_at ?? new Date().toISOString();
  const item_count =
    typeof payload.item_count === "number"
      ? payload.item_count
      : Array.isArray(payload.line_items)
        ? payload.line_items.length
        : null;
  const shop_url =
    typeof payload.shop_url === "string" && payload.shop_url
      ? payload.shop_url
      : getStoreBaseUrl();

  const customer_email =
    typeof payload.customer_email === "string" && payload.customer_email.trim()
      ? payload.customer_email.trim()
      : (payload.billing as { email?: string } | undefined)?.email?.trim() ?? null;
  const woo_customer_id =
    payload.customer_id != null
      ? typeof payload.customer_id === "number"
        ? payload.customer_id
        : parseInt(String(payload.customer_id), 10)
      : null;
  const woo_customer_id_valid =
    woo_customer_id != null && !Number.isNaN(woo_customer_id) ? woo_customer_id : null;

  const lineItems = compactLineItemsForMetadata(payload.line_items ?? null);
  const prev =
    existingMetadata && typeof existingMetadata === "object" && !Array.isArray(existingMetadata)
      ? { ...existingMetadata }
      : {};
  const metadata: Record<string, unknown> = {
    ...prev,
    source: "store_webhook",
    date_modified: payload.date_modified ?? payload.updated_at ?? null,
  };
  if (lineItems) {
    metadata.line_items = lineItems;
  }

  return {
    external_id,
    order_number,
    status: String(payload.status || "pending"),
    total_cents,
    currency,
    item_count,
    shop_url,
    user_id,
    referred_by_user_id,
    customer_email: customer_email || null,
    woo_customer_id: woo_customer_id_valid,
    created_at,
    metadata,
  };
}

/**
 * Validate and process an order webhook from the store. Signature must be verified by the caller
 * (API route) before calling this. Maps payload to app Order shape and upserts by external_id.
 */
export async function processStoreOrderWebhook(
  payload: unknown,
  options: ProcessStoreOrderWebhookOptions
): Promise<StoreWebhookResult> {
  if (!isStoreSyncEnabled()) {
    return { ok: false, error: "Store sync not enabled" };
  }
  const { supabase } = options;
  const parsed = parseOrderPayload(payload);
  if (!parsed) {
    return { ok: false, error: "Invalid payload: missing or invalid order id" };
  }

  const user_id = await resolveUserIdForOrder(supabase, {
    tracker_user_id: parsed.tracker_user_id,
    customer_id: parsed.customer_id,
    customer_email: parsed.customer_email,
    meta_data: parsed.meta_data,
  });

  const { data: existing } = await supabase
    .from("orders")
    .select("id, referred_by_user_id, metadata")
    .eq("external_id", String(parsed.id))
    .maybeSingle();

  const existingMeta =
    (existing as { metadata?: Record<string, unknown> | null } | null)?.metadata ?? null;
  const row = mapPayloadToOrderRow(parsed, user_id, existingMeta);
  const external_id = row.external_id as string;

  const existingReferred =
    (existing as { referred_by_user_id?: string | null } | null)?.referred_by_user_id ?? null;
  const payloadReferred = row.referred_by_user_id as string | null;
  const mergedReferred = existingReferred ?? payloadReferred;

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
        referred_by_user_id: mergedReferred,
        customer_email: row.customer_email ?? null,
        woo_customer_id: row.woo_customer_id ?? null,
        metadata: row.metadata,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) {
      return { ok: false, error: error.message };
    }
    const orderId = (updated as { id: string }).id;
    await attributeStoreOrderReferralIfNeeded(supabase, {
      orderId,
      orderExternalId: external_id,
      payload: parsed,
    });
    await grantPurchasePointsIfEligible(supabase, {
      userId: (row.user_id as string | null) ?? null,
      orderExternalId: external_id,
      orderStatus: row.status as string,
      orderTotalCents: (row.total_cents as number | null) ?? null,
      orderNumber: (row.order_number as string | null) ?? null,
    });
    return { ok: true, orderId };
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
      referred_by_user_id: mergedReferred,
      customer_email: row.customer_email ?? null,
      woo_customer_id: row.woo_customer_id ?? null,
      created_at: row.created_at,
      metadata: row.metadata,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }
  const orderId = (inserted as { id: string }).id;
  await attributeStoreOrderReferralIfNeeded(supabase, {
    orderId,
    orderExternalId: external_id,
    payload: parsed,
  });
  await grantPurchasePointsIfEligible(supabase, {
    userId: (row.user_id as string | null) ?? null,
    orderExternalId: external_id,
    orderStatus: row.status as string,
    orderTotalCents: (row.total_cents as number | null) ?? null,
    orderNumber: (row.order_number as string | null) ?? null,
  });
  return { ok: true, orderId };
}

/**
 * Optional: payload shape for a dedicated "referral attributed" webhook from the store.
 * Use when the store sends a separate event linking an order to an affiliate.
 */
export interface StoreReferralAttributedPayload {
  order_id: string;
  referred_by_user_id: string;
  [key: string]: unknown;
}

export interface ProcessStoreReferralWebhookOptions {
  supabase: SupabaseClient;
}

/**
 * Optional dedicated "referral attributed" webhook (same auth as order webhook).
 * Does not fail when the referrer cannot be resolved — logs to integration_sync_log and returns ok.
 */
export async function processStoreReferralWebhook(
  payload: unknown,
  options: ProcessStoreReferralWebhookOptions
): Promise<StoreWebhookResult> {
  if (!isStoreSyncEnabled()) {
    return { ok: false, error: "Store sync not enabled" };
  }
  const { supabase } = options;
  const result = await applyStoreReferralAttributedPayload(supabase, payload);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, orderId: result.orderId };
}

function parseShipmentPayload(p: unknown): StoreShipmentPayload | null {
  if (p == null || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  if (o.order_id == null && o.order_external_id == null) return null;
  if (o.status == null) return null;
  return p as StoreShipmentPayload;
}

/** Normalize to date-only (YYYY-MM-DD) for estimated_delivery DATE column. */
function toDateOnly(value: unknown): string | null {
  if (value == null) return null;
  const s = typeof value === "string" ? value : String(value);
  const match = s.slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/);
  if (match) return match[0];
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

/** Normalize to ISO string for timestamptz. */
function toTimestamp(value: unknown): string | null {
  if (value == null) return null;
  const s = typeof value === "string" ? value : String(value);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return null;
}

/**
 * Process a shipment webhook from the store. Caller must verify signature first.
 * Resolves order by store order id (order_id / order_external_id), then upserts shipment by external_id or (order_id, tracking_number).
 */
export async function processStoreShipmentWebhook(
  payload: unknown,
  options: ProcessStoreShipmentWebhookOptions
): Promise<StoreShipmentWebhookResult> {
  if (!isStoreSyncEnabled()) {
    return { ok: false, error: "Store sync not enabled" };
  }
  const { supabase } = options;
  const parsed = parseShipmentPayload(payload);
  if (!parsed) {
    return { ok: false, error: "Invalid payload: missing order_id/order_external_id or status" };
  }

  const orderExternalId = String(parsed.order_external_id ?? parsed.order_id);
  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("id")
    .eq("external_id", orderExternalId)
    .maybeSingle();

  if (orderError || !orderRow) {
    return { ok: false, error: "Order not found for store order id: " + orderExternalId };
  }

  const order_id = (orderRow as { id: string }).id;
  const external_id =
    parsed.id != null && String(parsed.id).trim() !== "" ? String(parsed.id) : null;
  const tracking_number =
    typeof parsed.tracking_number === "string" && parsed.tracking_number.trim()
      ? parsed.tracking_number.trim()
      : null;
  const carrier =
    typeof parsed.carrier === "string" && parsed.carrier.trim() ? parsed.carrier.trim() : null;
  const status = String(parsed.status || "shipped");
  const shipped_at = toTimestamp(parsed.shipped_at);
  const estimated_delivery = toDateOnly(
    parsed.estimated_delivery ?? parsed.estimated_delivery_at
  );
  const delivered_at = toTimestamp(parsed.delivered_at);

  if (!external_id && !tracking_number) {
    return { ok: false, error: "Payload must include id (shipment) or tracking_number" };
  }

  let existing: { id: string } | null = null;
  if (external_id) {
    const { data } = await supabase
      .from("shipments")
      .select("id")
      .eq("external_id", external_id)
      .maybeSingle();
    existing = data as { id: string } | null;
  }
  if (!existing && tracking_number) {
    const { data } = await supabase
      .from("shipments")
      .select("id")
      .eq("order_id", order_id)
      .eq("tracking_number", tracking_number)
      .maybeSingle();
    existing = data as { id: string } | null;
  }

  const row = {
    order_id,
    external_id,
    carrier,
    tracking_number,
    status,
    shipped_at,
    estimated_delivery,
    delivered_at,
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from("shipments")
      .update({
        carrier: row.carrier,
        tracking_number: row.tracking_number,
        status: row.status,
        shipped_at: row.shipped_at,
        estimated_delivery: row.estimated_delivery,
        delivered_at: row.delivered_at,
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, shipmentId: (updated as { id: string }).id };
  }

  const { data: inserted, error } = await supabase
    .from("shipments")
    .insert({
      order_id: row.order_id,
      external_id: row.external_id,
      carrier: row.carrier,
      tracking_number: row.tracking_number,
      status: row.status,
      shipped_at: row.shipped_at,
      estimated_delivery: row.estimated_delivery,
      delivered_at: row.delivered_at,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, shipmentId: (inserted as { id: string }).id };
}
