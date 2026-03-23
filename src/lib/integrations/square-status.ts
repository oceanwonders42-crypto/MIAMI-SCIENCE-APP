/**
 * Square invoice/order status lookup — fetch by id and return app-friendly shape.
 * Server-only; no secrets in returned data.
 */

import {
  getSquareConfig,
  fetchInvoiceById,
  fetchOrderById,
  normalizeSquareInvoice,
  type NormalizedSquareInvoice,
} from "./square-client";

export type SquareInvoiceStatusResult =
  | { ok: true; invoice: NormalizedSquareInvoice }
  | { ok: false; error: string };

/**
 * Fetch a Square invoice by id and return normalized status (no secrets).
 */
export async function fetchSquareInvoiceStatus(
  invoiceId: string
): Promise<SquareInvoiceStatusResult> {
  const config = getSquareConfig();
  if (!config) return { ok: false, error: "Square not configured" };
  const id = invoiceId.trim();
  if (!id) return { ok: false, error: "Invoice ID required" };

  const result = await fetchInvoiceById(config, id);
  if (!result.ok) return { ok: false, error: result.error };
  const normalized = normalizeSquareInvoice(result.data);
  if (!normalized) return { ok: false, error: "Invoice not found" };
  return { ok: true, invoice: normalized };
}

export type SquareOrderStatusResult =
  | { ok: true; order_id: string; state: string; total_cents: number | null; currency: string }
  | { ok: false; error: string };

/**
 * Fetch a Square order by id and return minimal status (no secrets).
 */
export async function fetchSquareOrderStatus(
  orderId: string,
  locationId?: string
): Promise<SquareOrderStatusResult> {
  const config = getSquareConfig();
  if (!config) return { ok: false, error: "Square not configured" };
  const id = orderId.trim();
  if (!id) return { ok: false, error: "Order ID required" };

  const result = await fetchOrderById(config, id, locationId);
  if (!result.ok) return { ok: false, error: result.error };
  const order = result.data;
  if (!order) return { ok: false, error: "Order not found" };

  const amount = order.total_money?.amount;
  const total_cents = typeof amount === "number" ? amount : null;
  const currency = order.total_money?.currency ?? "USD";
  return {
    ok: true,
    order_id: String(order.id ?? id),
    state: typeof order.state === "string" ? order.state : "unknown",
    total_cents,
    currency,
  };
}
