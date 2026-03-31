"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AffiliateProfile } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { updateAffiliateAction } from "./actions";

function numOrEmpty(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "";
  return String(v);
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "suspended", label: "Suspended" },
];

export function AffiliateEditForm({ profile }: { profile: AffiliateProfile }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    referral_code: profile.referral_code,
    coupon_code: profile.coupon_code ?? "",
    referral_link: profile.referral_link ?? "",
    slicewp_affiliate_id: profile.slicewp_affiliate_id ?? "",
    payout_status: profile.payout_status ?? "pending",
    status: profile.status,
    coupon_discount_percent: numOrEmpty(profile.coupon_discount_percent),
    commission_percent: numOrEmpty(profile.commission_percent),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const referralCode = form.referral_code.trim();
    if (!referralCode) {
      setError("Referral code is required.");
      return;
    }
    setLoading(true);
    const discountRaw = form.coupon_discount_percent.trim();
    const commissionRaw = form.commission_percent.trim();
    if (discountRaw !== "" && !Number.isFinite(Number(discountRaw))) {
      setError("Coupon discount % must be a number.");
      setLoading(false);
      return;
    }
    if (commissionRaw !== "" && !Number.isFinite(Number(commissionRaw))) {
      setError("Commission % must be a number.");
      setLoading(false);
      return;
    }
    const result = await updateAffiliateAction(profile.id, {
      referral_code: referralCode,
      coupon_code: form.coupon_code.trim() || null,
      referral_link: form.referral_link.trim() || null,
      slicewp_affiliate_id: form.slicewp_affiliate_id.trim() || null,
      payout_status: form.payout_status.trim() || null,
      status: form.status,
      coupon_discount_percent:
        discountRaw === "" ? null : Math.min(100, Math.max(0, Number(discountRaw))),
      commission_percent:
        commissionRaw === "" ? null : Math.min(100, Math.max(0, Number(commissionRaw))),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          User ID: <code className="text-xs">{profile.user_id}</code>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3">
              Profile updated.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Referral code *</label>
            <input
              type="text"
              value={form.referral_code}
              onChange={(e) =>
                setForm((p) => ({ ...p, referral_code: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Coupon code</label>
            <input
              type="text"
              value={form.coupon_code}
              onChange={(e) =>
                setForm((p) => ({ ...p, coupon_code: e.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Referral link</label>
            <input
              type="url"
              value={form.referral_link}
              onChange={(e) =>
                setForm((p) => ({ ...p, referral_link: e.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Shopper coupon discount % (override)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={form.coupon_discount_percent}
                onChange={(e) =>
                  setForm((p) => ({ ...p, coupon_discount_percent: e.target.value }))
                }
                placeholder="Program default if empty"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Commission % (override)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={form.commission_percent}
                onChange={(e) =>
                  setForm((p) => ({ ...p, commission_percent: e.target.value }))
                }
                placeholder="Program default if empty"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            After save, coupon % syncs to WooCommerce (when woo_coupon_id is set) and commission %
            to SliceWP (when slicewp_affiliate_id is set), using the effective values (override or
            program default).
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">
              SliceWP affiliate ID (optional)
            </label>
            <input
              type="text"
              value={form.slicewp_affiliate_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, slicewp_affiliate_id: e.target.value }))
              }
              placeholder="WordPress affiliate post ID"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payout status</label>
            <input
              type="text"
              value={form.payout_status}
              onChange={(e) =>
                setForm((p) => ({ ...p, payout_status: e.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as "active" | "paused" | "suspended",
                }))
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
