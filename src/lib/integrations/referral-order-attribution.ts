/**
 * Order referral attribution from WooCommerce / store webhooks.
 * Resolves referrer from affiliate_profiles (DB only — works with or without SliceWP API sync).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** integration_sync_log.integration value for referral webhook diagnostics */
export const REFERRAL_INTEGRATION_LOG_KEY = "store_order_referral";

export type ReferralAttributionOutcome =
  | "attributed"
  | "lookup_failed"
  | "skipped_existing_referrer"
  | "no_referrer_signals";

export interface ReferralAttributionLogEvent {
  outcome: ReferralAttributionOutcome;
  order_external_id: string;
  order_id?: string;
  referrer_user_id?: string | null;
  detail?: string;
  signals?: string;
  at: string;
}

function sanitizeMetaToken(s: string): string {
  return s.trim().replace(/[%_\\]/g, "");
}

function getMetaValue(
  meta: Array<{ key: string; value: string | number }> | null | undefined,
  key: string
): string | null {
  if (!Array.isArray(meta)) return null;
  const item = meta.find((m) => m?.key === key);
  if (item == null || item.value == null) return null;
  return String(item.value).trim();
}

/** First non-empty meta value for any of the given keys. */
function getMetaFirst(
  meta: Array<{ key: string; value: string | number }> | null | undefined,
  keys: string[]
): string | null {
  for (const k of keys) {
    const v = getMetaValue(meta, k);
    if (v) return v;
  }
  return null;
}

function extractCouponCodes(payload: {
  coupon_lines?: unknown;
}): string[] {
  const lines = payload.coupon_lines;
  if (!Array.isArray(lines)) return [];
  const out: string[] = [];
  for (const line of lines) {
    if (line && typeof line === "object" && "code" in line) {
      const code = (line as { code?: unknown }).code;
      if (typeof code === "string" && code.trim()) out.push(code.trim());
    }
  }
  return [...new Set(out)];
}

/**
 * Collect referral signals from a WooCommerce-style order payload.
 */
export function extractReferralSignalsFromOrderPayload(payload: {
  id: string | number;
  meta_data?: Array<{ key: string; value: string | number }> | null;
  coupon_lines?: unknown;
}): {
  slicewpAffiliateId: string | null;
  codesToMatch: string[];
  summary: string;
} {
  const meta = payload.meta_data ?? null;

  const slicewpRaw = getMetaFirst(meta, [
    "slicewp_affiliate_id",
    "_slicewp_affiliate_id",
    "slicewp_affiliate",
    "affiliate_id",
    "_affiliate_id",
  ]);
  const slicewpAffiliateId = slicewpRaw ? sanitizeMetaToken(slicewpRaw) : null;

  const codeFromMeta = getMetaFirst(meta, [
    "referral_code",
    "_referral_code",
    "ref",
    "_ref",
    "affiliate_referral_code",
  ]);

  const couponCodes = extractCouponCodes(payload);

  const codesToMatch = [
    ...(codeFromMeta ? [sanitizeMetaToken(codeFromMeta)] : []),
    ...couponCodes.map((c) => sanitizeMetaToken(c)),
  ].filter(Boolean);

  const uniqueCodes = [...new Set(codesToMatch)];

  const summaryParts: string[] = [];
  if (slicewpAffiliateId) summaryParts.push(`slicewp=${slicewpAffiliateId}`);
  if (uniqueCodes.length) summaryParts.push(`codes=${uniqueCodes.join(",")}`);

  return {
    slicewpAffiliateId,
    codesToMatch: uniqueCodes,
    summary: summaryParts.join("; ") || "(none)",
  };
}

function hasReferralSignals(signals: ReturnType<typeof extractReferralSignalsFromOrderPayload>): boolean {
  return Boolean(signals.slicewpAffiliateId || signals.codesToMatch.length > 0);
}

async function findActiveAffiliateUserId(
  supabase: SupabaseClient,
  signals: ReturnType<typeof extractReferralSignalsFromOrderPayload>
): Promise<string | null> {
  if (signals.slicewpAffiliateId) {
    const { data, error } = await supabase
      .from("affiliate_profiles")
      .select("user_id")
      .eq("slicewp_affiliate_id", signals.slicewpAffiliateId)
      .eq("status", "active")
      .maybeSingle();
    if (!error && data?.user_id) return data.user_id as string;
  }

  for (const raw of signals.codesToMatch) {
    const code = raw.trim();
    if (!code) continue;

    const { data: byCoupon } = await supabase
      .from("affiliate_profiles")
      .select("user_id")
      .ilike("coupon_code", code)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (byCoupon?.user_id) return byCoupon.user_id as string;

    const { data: byRef } = await supabase
      .from("affiliate_profiles")
      .select("user_id")
      .ilike("referral_code", code)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (byRef?.user_id) return byRef.user_id as string;
  }

  return null;
}

const MAX_LOG_EVENTS = 50;

/**
 * Append-style summary in integration_sync_log (single row per integration key).
 */
export async function logReferralAttributionEvent(
  supabase: SupabaseClient,
  partial: Omit<ReferralAttributionLogEvent, "at">
): Promise<void> {
  try {
    const event: ReferralAttributionLogEvent = {
      ...partial,
      at: new Date().toISOString(),
    };

    const { data: prev } = await supabase
      .from("integration_sync_log")
      .select("summary")
      .eq("integration", REFERRAL_INTEGRATION_LOG_KEY)
      .maybeSingle();

    const prevSummary = (prev?.summary as Record<string, unknown> | null) ?? {};
    const prevEvents = Array.isArray(prevSummary.events)
      ? (prevSummary.events as ReferralAttributionLogEvent[])
      : [];

    const events = [event, ...prevEvents].slice(0, MAX_LOG_EVENTS);

    await supabase.from("integration_sync_log").upsert(
      {
        integration: REFERRAL_INTEGRATION_LOG_KEY,
        last_run_at: event.at,
        summary: {
          last: event,
          events,
        },
      },
      { onConflict: "integration" }
    );
  } catch {
    /* never break webhooks */
  }
}

export interface AttributeStoreOrderReferralArgs {
  orderId: string;
  orderExternalId: string;
  payload: {
    id: string | number;
    meta_data?: Array<{ key: string; value: string | number }> | null;
    coupon_lines?: unknown;
  };
}

/**
 * If the order has no referrer yet, resolve from payload signals and update orders.referred_by_user_id.
 * Logs to integration_sync_log on success or lookup failure (when signals were present).
 */
export async function attributeStoreOrderReferralIfNeeded(
  supabase: SupabaseClient,
  args: AttributeStoreOrderReferralArgs
): Promise<void> {
  const { orderId, orderExternalId, payload } = args;

  try {
    const { data: row, error } = await supabase
      .from("orders")
      .select("referred_by_user_id")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !row) return;

    if (row.referred_by_user_id) {
      return;
    }

    const signals = extractReferralSignalsFromOrderPayload(payload);
    if (!hasReferralSignals(signals)) {
      return;
    }

    const referrerUserId = await findActiveAffiliateUserId(supabase, signals);

    if (!referrerUserId) {
      await logReferralAttributionEvent(supabase, {
        outcome: "lookup_failed",
        order_external_id: orderExternalId,
        order_id: orderId,
        referrer_user_id: null,
        detail: "No active affiliate_profiles match for extracted signals",
        signals: signals.summary,
      });
      return;
    }

    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update({ referred_by_user_id: referrerUserId })
      .eq("id", orderId)
      .is("referred_by_user_id", null)
      .select("id")
      .maybeSingle();

    if (updErr || !updated) {
      return;
    }

    await logReferralAttributionEvent(supabase, {
      outcome: "attributed",
      order_external_id: orderExternalId,
      order_id: orderId,
      referrer_user_id: referrerUserId,
      detail: "Set referred_by_user_id from webhook signals",
      signals: signals.summary,
    });
  } catch {
    /* silent */
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Dedicated referral webhook: set referred_by on an order by store order id + explicit UUID or referral code.
 */
export async function applyStoreReferralAttributedPayload(
  supabase: SupabaseClient,
  payload: unknown
): Promise<
  | { ok: true; orderId: string; attributed: boolean }
  | { ok: false; error: string }
> {
  if (payload == null || typeof payload !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const p = payload as Record<string, unknown>;
  const orderKey = p.order_id ?? p.order_external_id ?? p.id;
  if (orderKey == null) {
    return { ok: false, error: "Missing order_id" };
  }
  const externalId = String(orderKey);

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id, referred_by_user_id")
    .eq("external_id", externalId)
    .maybeSingle();

  if (oErr || !order) {
    return { ok: false, error: "Order not found for external_id: " + externalId };
  }

  const orderId = order.id as string;
  if (order.referred_by_user_id) {
    await logReferralAttributionEvent(supabase, {
      outcome: "skipped_existing_referrer",
      order_external_id: externalId,
      order_id: orderId,
      referrer_user_id: order.referred_by_user_id as string,
      detail: "Order already had referred_by_user_id",
    });
    return { ok: true, orderId, attributed: false };
  }

  let referrerUserId: string | null = null;
  const direct = p.referred_by_user_id;
  if (typeof direct === "string" && UUID_REGEX.test(direct)) {
    referrerUserId = direct;
  }

  if (!referrerUserId && typeof p.referral_code === "string" && p.referral_code.trim()) {
    referrerUserId = await findActiveAffiliateUserId(supabase, {
      slicewpAffiliateId: null,
      codesToMatch: [sanitizeMetaToken(p.referral_code)],
      summary: `referral_code=${p.referral_code.trim()}`,
    });
  }

  if (!referrerUserId) {
    await logReferralAttributionEvent(supabase, {
      outcome: "lookup_failed",
      order_external_id: externalId,
      order_id: orderId,
      detail: "Referral webhook: no valid referred_by_user_id or matching referral_code",
      signals:
        typeof p.referral_code === "string"
          ? `referral_code=${p.referral_code}`
          : "referred_by_user_id missing/invalid",
    });
    return { ok: true, orderId, attributed: false };
  }

  const { error: uErr } = await supabase
    .from("orders")
    .update({ referred_by_user_id: referrerUserId })
    .eq("id", orderId)
    .is("referred_by_user_id", null);

  if (uErr) {
    return { ok: false, error: uErr.message };
  }

  await logReferralAttributionEvent(supabase, {
    outcome: "attributed",
    order_external_id: externalId,
    order_id: orderId,
    referrer_user_id: referrerUserId,
    detail: "Set from dedicated referral webhook",
    signals:
      typeof p.referral_code === "string"
        ? `referral_code=${p.referral_code}`
        : "referred_by_user_id",
  });

  return { ok: true, orderId, attributed: true };
}
