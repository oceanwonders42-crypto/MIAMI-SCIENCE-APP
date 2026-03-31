"use client";

import { CopyField } from "@/components/affiliate/CopyField";
import { cn } from "@/lib/utils";

/**
 * Primary affiliate CTAs: referral code + link, highly visible with copy buttons.
 */
export function AffiliateReferralHero({
  referralCode,
  affiliateLink,
  emptyStateTitle,
  emptyStateDescription,
  className,
}: {
  referralCode: string | null | undefined;
  affiliateLink: string | null | undefined;
  /** Override default empty copy (e.g. SliceWP has no linked coupon). */
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  className?: string;
}) {
  const code = (referralCode ?? "").trim();
  const link = (affiliateLink ?? "").trim();
  const hasAny = code.length > 0 || link.length > 0;

  if (!hasAny) {
    return (
      <div
        className={cn(
          "rounded-2xl border-2 border-dashed border-amber-500/30 bg-zinc-950/60 px-6 py-10 text-center",
          className
        )}
      >
        <p className="text-sm font-semibold text-amber-200/90">
          {emptyStateTitle ?? "Referral code & link"}
        </p>
        <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
          {emptyStateDescription ??
            "Your referral code and link will appear here once your affiliate profile is configured. Contact Miami Science if you need help."}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      {code.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 p-5 sm:p-7 shadow-[0_0_60px_-12px_rgba(245,158,11,0.25)]"
          data-testid="affiliate-referral-code-box"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(251,191,36,0.12),transparent_50%)]" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/90">
              Your referral code
            </p>
            <p className="mt-1 text-xs text-zinc-500">Share this code at checkout</p>
            <div className="mt-4">
              <CopyField label="" value={code} variant="hero" className="!space-y-0" />
            </div>
          </div>
        </div>
      )}

      {link.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-zinc-900/60 p-5 sm:p-6 shadow-lg shadow-black/30">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400/85">Your affiliate link</p>
          <p className="mt-1 text-xs text-zinc-500 mb-3">Copy and share anywhere</p>
          <CopyField label="" value={link} className="!space-y-0" />
        </div>
      )}
    </div>
  );
}
