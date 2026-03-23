"use client";

import { useState } from "react";
import {
  fetchSquareInvoiceAction,
  fetchSquareOrderAction,
} from "./actions";
import type { NormalizedSquareInvoice } from "@/lib/integrations/square-client";

export function SquareStatusLookup() {
  const [invoiceId, setInvoiceId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<NormalizedSquareInvoice | null>(null);
  const [orderResult, setOrderResult] = useState<{
    order_id: string;
    state: string;
    total_cents: number | null;
    currency: string;
  } | null>(null);

  async function handleFetchInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceId.trim()) return;
    setLoadingInvoice(true);
    setInvoiceError(null);
    setInvoice(null);
    const out = await fetchSquareInvoiceAction(invoiceId.trim());
    setLoadingInvoice(false);
    if (!out.ok) {
      setInvoiceError(out.error);
      return;
    }
    setInvoice(out.invoice);
  }

  async function handleFetchOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoadingOrder(true);
    setOrderError(null);
    setOrderResult(null);
    const out = await fetchSquareOrderAction(orderId.trim());
    setLoadingOrder(false);
    if (!out.ok) {
      setOrderError(out.error);
      return;
    }
    setOrderResult({
      order_id: out.order_id,
      state: out.state,
      total_cents: out.total_cents,
      currency: out.currency,
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleFetchInvoice} className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Invoice ID
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            placeholder="e.g. inv_..."
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm w-64"
          />
          <button
            type="submit"
            disabled={loadingInvoice || !invoiceId.trim()}
            className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 text-sm disabled:opacity-50"
          >
            {loadingInvoice ? "Fetching…" : "Fetch invoice"}
          </button>
        </div>
        {invoiceError && (
          <p className="text-sm text-red-600 dark:text-red-400">{invoiceError}</p>
        )}
        {invoice && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-3 text-sm space-y-1">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Invoice</p>
            <ul className="text-zinc-600 dark:text-zinc-400">
              <li>ID: {invoice.id}</li>
              <li>Status: {invoice.status}</li>
              <li>Order ID: {invoice.order_id ?? "—"}</li>
              <li>Amount: {invoice.amount_cents != null ? `${(invoice.amount_cents / 100).toFixed(2)} ${invoice.currency}` : "—"}</li>
              <li>Updated: {invoice.updated_at ?? "—"}</li>
            </ul>
          </div>
        )}
      </form>
      <form onSubmit={handleFetchOrder} className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Order ID
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. order id from Square"
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm w-64"
          />
          <button
            type="submit"
            disabled={loadingOrder || !orderId.trim()}
            className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 text-sm disabled:opacity-50"
          >
            {loadingOrder ? "Fetching…" : "Fetch order"}
          </button>
        </div>
        {orderError && (
          <p className="text-sm text-red-600 dark:text-red-400">{orderError}</p>
        )}
        {orderResult && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-3 text-sm space-y-1">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Order</p>
            <ul className="text-zinc-600 dark:text-zinc-400">
              <li>ID: {orderResult.order_id}</li>
              <li>State: {orderResult.state}</li>
              <li>Total: {orderResult.total_cents != null ? `${(orderResult.total_cents / 100).toFixed(2)} ${orderResult.currency}` : "—"}</li>
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
