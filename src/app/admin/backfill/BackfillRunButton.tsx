"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { runBackfillAction } from "./actions";
import type { BackfillResult } from "@/lib/integrations/woocommerce-backfill";

export function BackfillRunButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackfillResult | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    const out = await runBackfillAction();
    setLoading(false);
    if (!out.ok) {
      setError(out.error);
      return;
    }
    setResult(out.result);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50"
      >
        {loading ? "Running…" : "Run customer & order import"}
      </button>
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-4 text-sm space-y-2">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Results</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Customers fetched: {result.customersFetched}</li>
            <li>Mappings created: {result.mappingsCreated}</li>
            <li>Orders fetched: {result.ordersFetched}</li>
            <li>Orders upserted: {result.ordersUpserted}</li>
            <li>Orders matched: {result.ordersMatched}</li>
            <li>Orders unmatched: {result.ordersUnmatched}</li>
          </ul>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-amber-600 dark:text-amber-400">
                {result.errors.length} error(s)
              </summary>
              <ul className="mt-1 list-inside text-xs text-zinc-500 dark:text-zinc-500">
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 20 && (
                  <li>… and {result.errors.length - 20} more</li>
                )}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
