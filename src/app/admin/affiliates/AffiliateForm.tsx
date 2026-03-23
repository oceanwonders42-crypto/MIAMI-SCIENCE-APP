"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { createAffiliateAction } from "./actions";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "suspended", label: "Suspended" },
];

export function AffiliateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    referral_code: "",
    coupon_code: "",
    referral_link: "",
    slicewp_affiliate_id: "",
    payout_status: "pending",
    status: "active" as "active" | "paused" | "suspended",
    set_role_affiliate: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const userId = form.user_id.trim();
    const referralCode = form.referral_code.trim();
    if (!userId || !referralCode) {
      setError("User ID and referral code are required.");
      return;
    }
    setLoading(true);
    const result = await createAffiliateAction({
      user_id: userId,
      referral_code: referralCode,
      coupon_code: form.coupon_code.trim() || null,
      referral_link: form.referral_link.trim() || null,
      slicewp_affiliate_id: form.slicewp_affiliate_id.trim() || null,
      payout_status: form.payout_status.trim() || null,
      status: form.status,
      set_role_affiliate: form.set_role_affiliate,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setForm({
      user_id: "",
      referral_code: "",
      coupon_code: "",
      referral_link: "",
      slicewp_affiliate_id: "",
      payout_status: "pending",
      status: "active",
      set_role_affiliate: true,
    });
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Get User ID from Supabase Auth dashboard (Users → select user → copy UUID).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3">
              Affiliate profile created. User role set to affiliate if checked.
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">User ID (UUID) *</label>
            <input
              type="text"
              value={form.user_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, user_id: e.target.value }))
              }
              required
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>
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
              placeholder="WordPress affiliate post ID — skips email lookup when set"
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
              placeholder="pending"
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.set_role_affiliate}
              onChange={(e) =>
                setForm((p) => ({ ...p, set_role_affiliate: e.target.checked }))
              }
              className="rounded border-zinc-300"
            />
            <span className="text-sm">Set user role to affiliate</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create affiliate"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
