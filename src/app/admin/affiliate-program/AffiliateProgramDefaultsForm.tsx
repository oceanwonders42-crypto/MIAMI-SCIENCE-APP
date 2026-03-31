"use client";

import { useState } from "react";
import { updateAffiliateProgramDefaultsAction } from "./actions";

export function AffiliateProgramDefaultsForm(props: {
  defaultCouponDiscountPercent: number;
  defaultCommissionPercent: number;
}) {
  const [couponPct, setCouponPct] = useState(String(props.defaultCouponDiscountPercent));
  const [commPct, setCommPct] = useState(String(props.defaultCommissionPercent));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const result = await updateAffiliateProgramDefaultsAction({
      default_coupon_discount_percent: Number(couponPct),
      default_commission_percent: Number(commPct),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3">
          Saved program defaults.
        </div>
      ) : null}
      <div>
        <label className="block text-sm font-medium mb-1">Default shopper discount (% off)</label>
        <input
          type="number"
          step="0.01"
          min={0}
          max={100}
          value={couponPct}
          onChange={(e) => setCouponPct(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Default affiliate commission (%)</label>
        <input
          type="number"
          step="0.01"
          min={0}
          max={100}
          value={commPct}
          onChange={(e) => setCommPct(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save defaults"}
      </button>
    </form>
  );
}
