/**
 * Customer mapping boundary — safe order-to-user resolution for store webhooks.
 *
 * For webhook and backfill resolution (including customer_mappings table), use
 * @/lib/customer-mapping: resolveUserIdForOrder(), getUserIdForWooCustomer(), etc.
 *
 * This file keeps the payload type and sync-only resolver for reference.
 * Store webhook uses resolveUserIdForOrder from lib/customer-mapping (async, uses DB).
 *
 * Do not silently attach orders to the wrong user. Only use trusted, explicit mappings.
 * Matching: tracker_user_id (valid UUID) or woo_customer_id → customer_mappings → user_id.
 * Never match by name only.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CustomerMappingPayload {
  /** Tracker app user_id (UUID). When present and valid, used directly. */
  tracker_user_id?: string | null;
  /** Store customer email. Future: lookup in profiles or mapping table when confidence is clear. */
  customer_email?: string | null;
  /** Store customer id (WooCommerce customer id). Future: mapping table store_customer_id → user_id. */
  store_customer_id?: string | number | null;
  /** WooCommerce-style meta_data array for tracker_user_id. */
  meta_data?: Array<{ key: string; value: string | number }> | null;
}

function getMetaValue(meta_data: CustomerMappingPayload["meta_data"], key: string): string | null {
  if (!Array.isArray(meta_data)) return null;
  const item = meta_data.find((m) => m?.key === key);
  if (item == null || item.value == null) return null;
  return String(item.value);
}

/**
 * Resolve tracker user_id from webhook payload. Safe: only returns a UUID when we have a trusted, explicit mapping.
 *
 * Now:
 * - Uses tracker_user_id (payload or meta_data) if it is a valid UUID; otherwise null.
 *
 * Future (when enabled and data exists):
 * - CUSTOMER_MAPPING_BY_EMAIL_ENABLED + customer_email: lookup user by email (e.g. profiles or verified-email table).
 * - store_customer_id: lookup in store_customer_mappings table. Do not enable until mapping is explicitly maintained.
 */
export function resolveUserIdFromPayload(payload: CustomerMappingPayload): string | null {
  const fromTrackerId =
    (typeof payload.tracker_user_id === "string" && UUID_REGEX.test(payload.tracker_user_id)
      ? payload.tracker_user_id
      : null) ?? getMetaValue(payload.meta_data ?? null, "tracker_user_id");
  if (fromTrackerId && UUID_REGEX.test(fromTrackerId)) return fromTrackerId;

  // Future: when CUSTOMER_MAPPING_BY_EMAIL_ENABLED and payload.customer_email is set,
  // lookup user by email (e.g. from profiles) and return only if single match and confidence is clear.
  // if (process.env.CUSTOMER_MAPPING_BY_EMAIL_ENABLED === "true" && payload.customer_email) { ... }

  // Future: when store_customer_mappings table exists and payload.store_customer_id is set,
  // lookup user_id by store_customer_id. Only enable when mapping is explicitly maintained (e.g. admin UI).
  // if (payload.store_customer_id != null) { ... }

  return null;
}
