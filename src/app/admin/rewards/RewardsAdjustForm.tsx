"use client";

import { useState } from "react";
import { adminAdjustRewardPointsAction } from "./actions";

export function RewardsAdjustForm() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const delta = parseInt(amount, 10);
    const result = await adminAdjustRewardPointsAction({
      userId,
      amountDelta: delta,
      reason,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setAmount("");
    setReason("");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 max-w-lg">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3">
          Ledger entry created. Balance updates on the user&apos;s Rewards page.
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">User ID (UUID)</label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          placeholder="00000000-0000-0000-0000-000000000000"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Points delta</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="e.g. 100 or -50"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        />
        <p className="text-xs text-zinc-500 mt-1">Positive adds points; negative removes (if balance allows).</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Reason (ledger)</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. goodwill_credit, correction"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2 px-4 text-sm"
      >
        {loading ? "Applying…" : "Apply adjustment"}
      </button>
    </form>
  );
}
