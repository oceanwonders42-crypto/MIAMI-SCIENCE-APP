"use client";

import { useState } from "react";
import {
  getMappingByUserIdAction,
  getMappingByWooIdAction,
  getMappingByEmailAction,
} from "./actions";
import type { CustomerMapping } from "@/types";

export function MappingLookupForm() {
  const [by, setBy] = useState<"user_id" | "woo_id" | "email">("user_id");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<CustomerMapping | null | "none">(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMapping(null);
    try {
      let result;
      if (by === "user_id") result = await getMappingByUserIdAction(value.trim());
      else if (by === "woo_id") result = await getMappingByWooIdAction(value.trim());
      else result = await getMappingByEmailAction(value.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMapping(result.mapping ?? "none");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleLookup} className="flex flex-wrap items-end gap-2">
        <select
          value={by}
          onChange={(e) => setBy(e.target.value as "user_id" | "woo_id" | "email")}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="user_id">User ID (UUID)</option>
          <option value="woo_id">WooCommerce customer ID</option>
          <option value="email">Customer email</option>
        </select>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            by === "user_id"
              ? "uuid"
              : by === "woo_id"
                ? "12345"
                : "user@example.com"
          }
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm w-64"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 text-sm disabled:opacity-50"
        >
          {loading ? "Looking up…" : "Look up"}
        </button>
      </form>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {mapping === "none" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">No mapping found.</p>
      )}
      {mapping && mapping !== "none" && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-3 text-sm space-y-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Mapping</p>
          <ul className="text-zinc-600 dark:text-zinc-400">
            <li>User ID: <code className="text-xs">{mapping.user_id}</code></li>
            <li>Woo customer ID: {mapping.woo_customer_id}</li>
            <li>Email: {mapping.customer_email}</li>
            <li>Match source: {mapping.match_source}</li>
            <li>Matched at: {new Date(mapping.matched_at).toLocaleString()}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
