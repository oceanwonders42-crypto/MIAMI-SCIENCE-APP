"use client";

import { useState, useEffect } from "react";
import { getOrderDiagnosticsAction } from "./actions";

export function OrderDiagnosticsCard() {
  const [data, setData] = useState<{
    total: number;
    linked: number;
    unmatched: number;
    byStatus: Record<string, { linked: number; unmatched: number }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getOrderDiagnosticsAction().then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setData({
        total: result.total,
        linked: result.linked,
        unmatched: result.unmatched,
        byStatus: result.byStatus,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!data) return null;

  const statuses = Object.entries(data.byStatus).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-4">
        <span><strong className="text-zinc-700 dark:text-zinc-300">Total orders:</strong> {data.total}</span>
        <span><strong className="text-emerald-700 dark:text-emerald-400">Linked:</strong> {data.linked}</span>
        <span><strong className="text-amber-700 dark:text-amber-400">Unmatched:</strong> {data.unmatched}</span>
      </div>
      {statuses.length > 0 && (
        <details className="text-zinc-600 dark:text-zinc-400">
          <summary className="cursor-pointer">By status</summary>
          <ul className="mt-2 space-y-1">
            {statuses.map(([status, counts]) => (
              <li key={status}>
                {status}: linked {counts.linked}, unmatched {counts.unmatched}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
