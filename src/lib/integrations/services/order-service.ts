/**
 * Integration service: orders from external APIs → app-friendly shape.
 * Uses WooCommerce client; other sources can be added later.
 */

import {
  getWooCommerceConfig,
  fetchOrders,
  fetchOrderById,
  normalizeWooOrder,
  type NormalizedWooOrder,
} from "../woocommerce-client";

export type NormalizedOrder = NormalizedWooOrder;

export async function getOrdersFromWooCommerce(params?: {
  per_page?: number;
  page?: number;
  status?: string;
}): Promise<{ ok: true; orders: NormalizedOrder[] } | { ok: false; error: string }> {
  const config = getWooCommerceConfig();
  if (!config) return { ok: false, error: "WooCommerce not configured" };
  const result = await fetchOrders(config, params);
  if (!result.ok) return { ok: false, error: result.error };
  const orders = result.data.map((raw) => normalizeWooOrder(raw, config.baseUrl));
  return { ok: true, orders };
}

export async function getOrderByIdFromWooCommerce(
  id: string
): Promise<{ ok: true; order: NormalizedOrder } | { ok: false; error: string }> {
  const config = getWooCommerceConfig();
  if (!config) return { ok: false, error: "WooCommerce not configured" };
  const result = await fetchOrderById(config, id);
  if (!result.ok) return { ok: false, error: result.error };
  const order = normalizeWooOrder(result.data, config.baseUrl);
  return { ok: true, order };
}
