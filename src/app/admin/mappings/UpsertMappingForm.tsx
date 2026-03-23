"use client";

import { useState } from "react";
import { upsertMappingAction } from "./actions";
import type { CustomerMappingMatchSource } from "@/types";

const MATCH_SOURCES: CustomerMappingMatchSource[] = [
  "manual",
  "auto_email",
  "email",
  "imported",
  "woo_customer_id",
];

export function UpsertMappingForm() {
  const [user_id, setUser_id] = useState("");
  const [woo_customer_id, setWoo_customer_id] = useState("");
  const [customer_email, setCustomer_email] = useState("");
  const [match_source, setMatch_source] = useState<CustomerMappingMatchSource>("manual");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const n = parseInt(woo_customer_id.trim(), 10);
    if (Number.isNaN(n) || n < 1) {
      setMessage({ type: "error", text: "WooCommerce customer ID must be a positive integer." });
      setLoading(false);
      return;
    }
    const result = await upsertMappingAction(
      user_id.trim(),
      n,
      customer_email.trim(),
      match_source
    );
    setLoading(false);
    if (result.ok) {
      setMessage({ type: "success", text: "Mapping saved. One mapping per user; existing mapping for this user was updated." });
    } else {
      setMessage({ type: "error", text: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          User ID (UUID)
        </label>
        <input
          type="text"
          value={user_id}
          onChange={(e) => setUser_id(e.target.value)}
          placeholder="From Supabase Auth or dashboard"
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm w-full max-w-md font-mono"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          WooCommerce customer ID
        </label>
        <input
          type="number"
          min={1}
          value={woo_customer_id}
          onChange={(e) => setWoo_customer_id(e.target.value)}
          placeholder="e.g. 12345"
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm w-40"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Customer email
        </label>
        <input
          type="email"
          value={customer_email}
          onChange={(e) => setCustomer_email(e.target.value)}
          placeholder="Store customer email (normalized)"
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm w-full max-w-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Match source
        </label>
        <select
          value={match_source}
          onChange={(e) => setMatch_source(e.target.value as CustomerMappingMatchSource)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          {MATCH_SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 text-sm disabled:opacity-50"
      >
        {loading ? "Saving…" : "Create or update mapping"}
      </button>
      {message && (
        <p
          className={
            message.type === "success"
              ? "text-sm text-emerald-600 dark:text-emerald-400"
              : "text-sm text-red-600 dark:text-red-400"
          }
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
