import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole, isAffiliateOrAdmin } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";
import { loadAffiliateTabData, formatLastSyncedRelative } from "@/lib/affiliate-dashboard";
import { formatCommissionCents } from "@/lib/affiliates";
import { AffiliateReferralHero } from "@/components/affiliate/AffiliateReferralHero";
import { AffiliateFreeProductUnlock } from "@/components/affiliate/AffiliateFreeProductUnlock";
import { AffiliatePayoutForm } from "@/components/affiliate/AffiliatePayoutForm";
import { cn } from "@/lib/utils";
import type { ReferredOrderView } from "@/lib/integrations/affiliate-provider";
import type { AffiliateConnectionBanner } from "@/lib/affiliate-dashboard";

function Money({ cents, className }: { cents: number; className?: string }) {
  return (
    <span
      className={cn(
        "tabular-nums font-bold tracking-tight text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.15)]",
        className
      )}
    >
      {formatCommissionCents(cents)}
    </span>
  );
}

function StatusBadge({ status }: { status: ReferredOrderView["displayStatus"] }) {
  const map = {
    pending: "bg-amber-500/15 text-amber-200 border-amber-500/35",
    approved: "bg-sky-500/15 text-sky-200 border-sky-500/35",
    paid: "bg-emerald-500/15 text-emerald-200 border-emerald-500/35",
  } as const;
  const label =
    status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Paid";
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        map[status]
      )}
    >
      {label}
    </span>
  );
}

function SliceWPStatusBanner({
  connection,
  lastSyncedAt,
  isAdmin,
}: {
  connection: AffiliateConnectionBanner;
  lastSyncedAt: string | null;
  isAdmin: boolean;
}) {
  if (connection.variant === "connected") {
    const rel = formatLastSyncedRelative(lastSyncedAt);
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/45 bg-emerald-950/40 px-4 py-3.5 shadow-[0_0_36px_-10px_rgba(16,185,129,0.4)]">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-35" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.95)]" />
        </span>
        <p className="text-sm font-semibold text-emerald-100">
          SliceWP connected — last synced {rel}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-500/45 bg-amber-950/35 px-4 py-3.5">
      <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.75)]" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-amber-100">
          SliceWP not connected — contact admin to set up
        </p>
        {connection.variant === "configured_unlinked" && "detail" in connection && connection.detail && (
          <p className="text-xs text-amber-200/80 leading-snug">{connection.detail}</p>
        )}
        {connection.variant === "not_configured" && (
          <p className="text-xs text-amber-200/75">
            Set up SliceWP in Admin → Integrations, or ask Miami Science to link your affiliate account.
          </p>
        )}
        {connection.variant === "not_configured" && isAdmin && (
          <Link
            href={ROUTES.adminIntegrations}
            className="inline-block text-xs font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            Open Integrations
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function AffiliatePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (!isAffiliateOrAdmin(role)) redirect(ROUTES.dashboard);
  const isAdmin = role === "admin";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? SHOP_REFILL_URL;
  const { profileView, connection, commissions, referredOrders, lastSyncedAt } =
    await loadAffiliateTabData(supabase, user.id, baseUrl);

  const profile = profileView.profile;
  const hasProfile = profile != null;

  const referralCodeDisplay =
    (profileView.couponCode?.trim() || profile?.referral_code?.trim() || "") || null;

  return (
    <>
      <Header title="Affiliate" subtitle="Commissions, referrals & payouts" />
      <div className="px-4 md:px-6 space-y-8 pb-10">
        <SliceWPStatusBanner connection={connection} lastSyncedAt={lastSyncedAt} isAdmin={isAdmin} />

        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500/90">
            Share & earn
          </h2>
          <AffiliateReferralHero
            referralCode={referralCodeDisplay}
            affiliateLink={profileView.referralLink || null}
          />
        </section>

        <AffiliateFreeProductUnlock referralCount={commissions.referralUsesAllTime} />

        <div className="grid grid-cols-2 gap-3 max-w-lg">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Referral uses (month)
            </p>
            <p className="text-2xl font-bold tabular-nums text-amber-300 mt-1">
              {commissions.referralUsesThisMonth}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Referral orders (all time)
            </p>
            <p className="text-2xl font-bold tabular-nums text-amber-300 mt-1">
              {commissions.referralUsesAllTime}
            </p>
          </div>
        </div>

        <Section title="Commission dashboard">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-amber-500/20 bg-gradient-to-b from-amber-950/30 to-zinc-950/80 overflow-hidden">
              <CardContent className="pt-6 pb-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total earned
                </p>
                <p className="text-[10px] text-zinc-600">All time</p>
                <p className="text-3xl md:text-4xl">
                  <Money cents={commissions.totalEarnedCents} />
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/15 bg-zinc-950/60">
              <CardContent className="pt-6 pb-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Earned this month
                </p>
                <p className="text-[10px] text-zinc-600">Calendar month (UTC)</p>
                <p className="text-3xl md:text-4xl">
                  <Money cents={commissions.monthEarnedCents} />
                </p>
                {commissions.dataSource !== "slice" && (
                  <p className="text-[11px] text-zinc-500 pt-1">
                    Monthly commission detail requires SliceWP sync. Estimates may appear in cache.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-zinc-950/80">
              <CardContent className="pt-6 pb-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Available for payout
                </p>
                <p className="text-[10px] text-zinc-600">Unpaid / pending</p>
                <p className="text-3xl md:text-4xl">
                  <Money cents={commissions.availablePayoutCents} />
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Recent referrals">
          <p className="text-xs text-zinc-500 -mt-2 mb-3">
            Privacy-first: we only show date, totals, and commission — no customer names or contact info.
          </p>
          <Card className="border-zinc-800">
            <CardContent className="py-0">
              {referredOrders.length === 0 ? (
                <p className="text-sm text-zinc-500 py-10 text-center">
                  No referred orders yet. When someone checks out with your link or code, orders will appear
                  here.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
                        <th className="py-3 pr-4 font-medium">Date</th>
                        <th className="py-3 pr-4 font-medium text-right">Order total</th>
                        <th className="py-3 pr-4 font-medium text-right">Commission</th>
                        <th className="py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referredOrders.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b border-zinc-800/80 last:border-0 hover:bg-zinc-900/40"
                        >
                          <td className="py-3 pr-4 text-zinc-400 whitespace-nowrap">
                            {new Date(o.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-amber-200/95">
                            {formatCommissionCents(o.orderTotalCents)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-amber-300 font-semibold">
                            {o.commissionCents > 0
                              ? formatCommissionCents(o.commissionCents)
                              : "—"}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={o.displayStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>

        <Section title="Payout info">
          {hasProfile ? (
            <AffiliatePayoutForm profile={profile} />
          ) : (
            <Card className="border-zinc-800 bg-zinc-950/50">
              <CardContent className="py-8 text-center text-sm text-zinc-500">
                Your affiliate profile isn&apos;t set up yet. Contact Miami Science to enable payout details.
              </CardContent>
            </Card>
          )}
        </Section>
      </div>
    </>
  );
}
