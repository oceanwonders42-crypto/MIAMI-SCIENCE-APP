import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import {
  loadAffiliatePayoutAdminRows,
  sliceWpCommissionsAdminUrl,
  sliceWpPayoutsAdminUrl,
} from "@/lib/admin/affiliate-payouts";
import { AffiliateSliceStatsBackfillButton } from "./AffiliateSliceStatsBackfillButton";

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function AdminAffiliatePayoutsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect(ROUTES.dashboard);

  const service = createServiceRoleClient();
  const { rows, sliceConfigured } = await loadAffiliatePayoutAdminRows(service);
  const pendingOnly = rows.filter((r) => r.pendingPayoutRowCount > 0 || r.pendingPayoutCents > 0);

  return (
    <>
      <Header title="Affiliate payouts" subtitle="Pending SliceWP commissions & cache backfill" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="SliceWP admin">
          <Card>
            <CardContent className="py-4 flex flex-wrap gap-4 text-sm">
              <a
                href={sliceWpPayoutsAdminUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Open SliceWP payouts (WordPress) ↗
              </a>
              <a
                href={sliceWpCommissionsAdminUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Open SliceWP commissions ↗
              </a>
            </CardContent>
          </Card>
        </Section>

        <Section title="Dashboard cache rebuild">
          <Card>
            <CardContent className="py-4 space-y-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Re-fetches all historical SliceWP commissions per affiliate and overwrites the
                <span className="font-mono"> slice_sync</span> row in{" "}
                <span className="font-mono">affiliate_stats_cache</span>. Safe to run repeatedly.
              </p>
              {!sliceConfigured ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  SliceWP sync is not configured in this deployment (missing flag or API env).
                </p>
              ) : (
                <AffiliateSliceStatsBackfillButton />
              )}
            </CardContent>
          </Card>
        </Section>

        <Section title={`Pending payout (${pendingOnly.length})`}>
          {!sliceConfigured ? (
            <Card>
              <CardContent className="py-8 text-sm text-zinc-500">
                Configure SliceWP on the server to load payout data.
              </CardContent>
            </Card>
          ) : pendingOnly.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-zinc-500">
                No affiliates with unpaid / pending commission rows in SliceWP, or SliceWP returned no data.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {pendingOnly.map((r) => (
                <li key={r.profileId}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{r.displayLabel}</CardTitle>
                      <p className="text-xs text-zinc-500 font-mono truncate">
                        {r.email ?? r.userId} · promo {r.promoCode ?? "—"} · Slice {r.sliceId}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm space-y-1">
                      <p>
                        <span className="text-zinc-500">Pending payout: </span>
                        <span className="font-medium">{formatMoney(r.pendingPayoutCents)}</span>
                        <span className="text-zinc-500">
                          {" "}
                          ({r.pendingPayoutRowCount} unpaid row{r.pendingPayoutRowCount === 1 ? "" : "s"})
                        </span>
                      </p>
                      <p>
                        <span className="text-zinc-500">Lifetime earned (non-rejected): </span>
                        {formatMoney(r.totalEarnedCents)} · referrals {r.referralCountAllTime}
                      </p>
                      {r.payoutStatus ? (
                        <p className="text-zinc-500">Profile payout status: {r.payoutStatus}</p>
                      ) : null}
                      <Link
                        href={`${ROUTES.adminAffiliates}/${r.profileId}/edit`}
                        className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                      >
                        Edit affiliate profile →
                      </Link>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="All SliceWP-linked affiliates">
          {rows.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-zinc-500">No profiles with SliceWP id.</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
                      <th className="pr-4 py-2">Affiliate</th>
                      <th className="pr-4 py-2">Promo</th>
                      <th className="pr-4 py-2">Pending</th>
                      <th className="pr-4 py-2">Rows</th>
                      <th className="pr-4 py-2">Lifetime</th>
                      <th className="py-2">Referrals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.profileId} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="pr-4 py-2">
                          <div className="font-medium">{r.displayLabel}</div>
                          <div className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {r.email ?? r.userId}
                          </div>
                        </td>
                        <td className="pr-4 py-2 font-mono text-xs">{r.promoCode ?? "—"}</td>
                        <td className="pr-4 py-2">{formatMoney(r.pendingPayoutCents)}</td>
                        <td className="pr-4 py-2">{r.pendingPayoutRowCount}</td>
                        <td className="pr-4 py-2">{formatMoney(r.totalEarnedCents)}</td>
                        <td className="py-2">{r.referralCountAllTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </Section>

        <p className="text-sm">
          <Link href={ROUTES.adminAffiliates} className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Affiliates
          </Link>
        </p>
      </div>
    </>
  );
}
