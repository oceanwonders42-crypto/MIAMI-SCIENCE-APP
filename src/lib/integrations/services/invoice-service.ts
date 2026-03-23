/**
 * Integration service: invoice/payment status from external APIs → app-friendly shape.
 * Uses Square client; other sources can be added later.
 */

import {
  getSquareConfig,
  fetchInvoiceById,
  fetchOrderById,
  normalizeSquareInvoice,
  type NormalizedSquareInvoice,
} from "../square-client";

export type NormalizedInvoice = NormalizedSquareInvoice;

export async function getInvoiceByIdFromSquare(
  invoiceId: string
): Promise<{ ok: true; invoice: NormalizedInvoice } | { ok: false; error: string }> {
  const config = getSquareConfig();
  if (!config) return { ok: false, error: "Square not configured" };
  const result = await fetchInvoiceById(config, invoiceId);
  if (!result.ok) return { ok: false, error: result.error };
  const invoice = normalizeSquareInvoice(result.data);
  if (!invoice) return { ok: false, error: "Invoice not found" };
  return { ok: true, invoice };
}

export async function getOrderByIdFromSquare(
  orderId: string,
  locationId?: string
): Promise<
  | { ok: true; orderId: string; state: string; total_cents: number | null; currency: string }
  | { ok: false; error: string }
> {
  const config = getSquareConfig();
  if (!config) return { ok: false, error: "Square not configured" };
  const result = await fetchOrderById(config, orderId, locationId);
  if (!result.ok) return { ok: false, error: result.error };
  const order = result.data;
  if (!order) return { ok: false, error: "Order not found" };
  const amount = order.total_money?.amount;
  const total_cents = typeof amount === "number" ? amount : null;
  const currency = order.total_money?.currency ?? "USD";
  return {
    ok: true,
    orderId: String(order.id ?? orderId),
    state: typeof order.state === "string" ? order.state : "unknown",
    total_cents,
    currency,
  };
}
