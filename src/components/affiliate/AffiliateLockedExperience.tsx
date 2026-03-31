"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Step = "code" | "promo";

export function AffiliateLockedExperience(props: {
  initialStep: Step;
  programCouponDiscountPercent: number;
  programCommissionPercent: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(props.initialStep);
  const [codeInput, setCodeInput] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);

  async function submitUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuggestedCode(null);
    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/unlock-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not verify code.");
        setLoading(false);
        return;
      }
      setStep("promo");
      setLoading(false);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  async function submitPromo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuggestedCode(null);
    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/complete-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: promoInput }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        suggestedCode?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Onboarding failed.");
        if (data.suggestedCode) setSuggestedCode(data.suggestedCode);
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="px-4 md:px-6 space-y-8 pb-10 max-w-2xl">
      <div className="rounded-2xl border border-amber-500/40 bg-amber-950/25 px-4 py-5 space-y-2">
        <p className="text-sm font-semibold text-amber-100">Affiliate access locked</p>
        <p className="text-sm text-amber-200/85 leading-snug">
          Full commissions, referral tools, and team chat unlock when your account is linked to our
          affiliate program (SliceWP + store). If you already have a SliceWP affiliate on this email,
          we link it automatically. Otherwise, use the program unlock code to create your affiliate
          profile and store coupon.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-950/50">
        <CardContent className="py-5 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-400/90">
            Why become an affiliate
          </p>
          <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-5">
            <li>Earn {props.programCommissionPercent}% commission on referred orders (program default).</li>
            <li>Share a {props.programCouponDiscountPercent}% shopper discount with your promo code.</li>
            <li>Track commissions and payouts in this tab when synced with SliceWP.</li>
            <li>Access the affiliate team room in Community after you are linked.</li>
          </ul>
        </CardContent>
      </Card>

      {step === "code" ? (
        <Card className="border-zinc-700">
          <CardContent className="py-5 space-y-4">
            <p className="text-sm font-medium text-zinc-200">Unlock with program code</p>
            <p className="text-xs text-zinc-500">
              Enter the code provided by Miami Science to start onboarding. Invalid codes are rejected
              on the server — there is no client-only unlock.
            </p>
            <form onSubmit={submitUnlock} className="space-y-3">
              {error ? (
                <p className="text-sm text-red-400" data-testid="affiliate-unlock-error">
                  {error}
                </p>
              ) : null}
              <input
                type="text"
                autoComplete="off"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Program code"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "rounded-lg font-medium py-2.5 px-4 text-sm",
                  "bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
                )}
              >
                {loading ? "Checking…" : "Unlock onboarding"}
              </button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-zinc-700">
          <CardContent className="py-5 space-y-4">
            <p className="text-sm font-medium text-zinc-200">Choose your promo code</p>
            <p className="text-xs text-zinc-500">
              Letters, numbers, hyphen, and underscore only (stored in UPPERCASE). Must be unique in the
              store and in our app. We create your WooCommerce coupon and SliceWP affiliate only after
              validation succeeds.
            </p>
            <form onSubmit={submitPromo} className="space-y-3">
              {error ? (
                <p className="text-sm text-red-400" data-testid="affiliate-promo-error">
                  {error}
                </p>
              ) : null}
              {suggestedCode ? (
                <p className="text-xs text-amber-200/90">
                  Try instead:{" "}
                  <button
                    type="button"
                    className="font-mono underline"
                    onClick={() => setPromoInput(suggestedCode)}
                  >
                    {suggestedCode}
                  </button>
                </p>
              ) : null}
              <input
                type="text"
                autoComplete="off"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="YOUR-CODE"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 font-mono uppercase"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50"
                >
                  {loading ? "Provisioning…" : "Create affiliate & coupon"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  className="rounded-lg border border-zinc-600 py-2.5 px-4 text-sm text-zinc-400"
                  onClick={() => {
                    setStep("code");
                    setError(null);
                  }}
                >
                  Back
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
