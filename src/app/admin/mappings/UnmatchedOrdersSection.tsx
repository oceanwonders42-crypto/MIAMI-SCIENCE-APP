"use client";

import { useState, useEffect } from "react";
import { getUnmatchedOrdersAction, getCandidatesForEmailAction } from "./actions";
import type { UnmatchedOrderRow } from "./actions";

export function UnmatchedOrdersSection() {
  const [orders, setOrders] = useState<UnmatchedOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidatesByEmail, setCandidatesByEmail] = useState<Record<string, { user_id: string }[]>>({});
  const [loadingCandidates, setLoadingCandidates] = useState<string | null>(null);

  async function load(offset = 0) {
    setLoading(true);
    setError(null);
    const result = await getUnmatchedOrdersAction(50, offset);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrders(result.orders);
    setTotal(result.total);
  }

  useEffect(() => {
    load();
  }, []);

  async function findCandidates(email: string | null) {
    if (!email?.trim()) return;
    setLoadingCandidates(email);
    const result = await getCandidatesForEmailAction(email);
    setLoadingCandidates(null);
    if (result.ok) setCandidatesByEmail((prev) => ({ ...prev, [email]: result.candidates }));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Orders with no linked user (user_id null). Use &quot;Find candidates&quot; to see app users with the same email — then create a mapping manually if correct. No auto-link.
      </p>
      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!loading && !error && (
        <>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total unmatched: {total}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-2 pr-2">Order</th>
                  <th className="text-left py-2 pr-2">Email</th>
                  <th className="text-left py-2 pr-2">Woo ID</th>
                  <th className="text-left py-2 pr-2">Status</th>
                  <th className="text-left py-2 pr-2">Created</th>
                  <th className="text-left py-2">Candidates</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 pr-2">
                      <span className="font-mono text-xs">{o.order_number ?? o.external_id ?? o.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-2 pr-2 text-zinc-600 dark:text-zinc-400">
                      {o.customer_email ?? "—"}
                    </td>
                    <td className="py-2 pr-2">{o.woo_customer_id ?? "—"}</td>
                    <td className="py-2 pr-2">{o.status}</td>
                    <td className="py-2 pr-2 text-zinc-500">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2">
                      {o.customer_email ? (
                        <>
                          <button
                            type="button"
                            onClick={() => findCandidates(o.customer_email)}
                            disabled={loadingCandidates === o.customer_email}
                            className="text-primary-600 dark:text-primary-400 hover:underline text-xs disabled:opacity-50"
                          >
                            {loadingCandidates === o.customer_email
                              ? "…"
                              : "Find candidates"}
                          </button>
                          {candidatesByEmail[o.customer_email] && (
                            <span className="ml-2 text-zinc-500 text-xs">
                              {candidatesByEmail[o.customer_email].length} user(s):{" "}
                              {candidatesByEmail[o.customer_email]
                                .map((c) => c.user_id.slice(0, 8))
                                .join(", ")}
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && total === 0 && (
            <p className="text-sm text-zinc-500">No unmatched orders.</p>
          )}
        </>
      )}
    </div>
  );
}
