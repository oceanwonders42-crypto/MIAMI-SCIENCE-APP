/**
 * Store integration config — Miami Science store (mia-science.com, Droplet-hosted).
 * The tracker app is a separate app; all store links and future sync (WooCommerce API/webhooks)
 * go through this boundary. Do not hardcode credentials; use env only.
 *
 * Canonical store: https://mia-science.com
 * Future integration path: WooCommerce REST API / webhooks from the Droplet-hosted store.
 */

import { createHmac } from "crypto";

const STORE_BASE_URL =
  process.env.NEXT_PUBLIC_STORE_URL ??
  process.env.NEXT_PUBLIC_SHOP_REFILL_URL ??
  "https://mia-science.com";

/** Whether store sync (e.g. webhooks) is enabled. Set when webhook secret or API credentials are configured. */
const STORE_SYNC_ENABLED = process.env.STORE_SYNC_ENABLED === "true";

/**
 * Base URL of the Miami Science store (Droplet). Use for shop links, refill CTAs, and as
 * target for future WooCommerce webhook source. No trailing slash.
 */
export function getStoreBaseUrl(): string {
  return STORE_BASE_URL.replace(/\/$/, "");
}

/**
 * Whether the app is configured for store sync (webhooks or API). When true, webhook
 * routes or cron jobs can process incoming order/referral data. Do not enable until
 * credentials (e.g. WOOCOMMERCE_WEBHOOK_SECRET) are set.
 */
export function isStoreSyncEnabled(): boolean {
  return STORE_SYNC_ENABLED;
}

/**
 * Verify WooCommerce webhook signature. Uses WOOCOMMERCE_WEBHOOK_SECRET; no secret in args.
 * Signature must be in X-WC-Webhook-Signature (HMAC-SHA256 of raw body, base64).
 */
export function verifyWooCommerceWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
  if (!secret || !signature?.trim()) return false;
  try {
    const computed = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
    return computed === signature.trim();
  } catch {
    return false;
  }
}
