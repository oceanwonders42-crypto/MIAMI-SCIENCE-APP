import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { loadAdminDashboardStats } from "@/lib/admin/dashboard-stats";
import { AdminOverviewStats } from "@/components/admin/AdminOverviewStats";
import { AdminHealthSection } from "@/components/admin/AdminHealthSection";
import { AdminInsightsSection } from "@/components/admin/AdminInsightsSection";

export default async function AdminPage() {
  const service = createServiceRoleClient();
  const stats = await loadAdminDashboardStats(service);

  return (
    <>
      <Header title="Admin" subtitle="Overview & tools" />
      <div className="px-4 md:px-6 space-y-10 pb-8">
        <Section title="Stats overview">
          <AdminOverviewStats stats={stats} />
        </Section>

        <Section title="App health">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Green = recent success; amber = stale; red = missing or very old. Webhook reflects last successful order
            processing.
          </p>
          <AdminHealthSection rows={stats.integrationHealth} />
        </Section>

        <Section title="Admin insights">
          <AdminInsightsSection stats={stats} />
        </Section>

        <Section title="Launch & QA">
          <Card className="border-primary-200 dark:border-primary-800">
            <CardContent className="py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Pre-launch checklist, diagnostics, and QA helpers. Internal only.
              </p>
              <Link
                href="/admin/qa"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Open QA & launch readiness →
              </Link>
            </CardContent>
          </Card>
        </Section>

        <Section title="Announcements">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dashboard announcements</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Create rich HTML posts; published items appear on the home dashboard immediately after save.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.adminAnnouncements}
                className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 text-sm"
              >
                Manage announcements
              </Link>
              <Link
                href={`${ROUTES.adminAnnouncements}/new`}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 py-2 px-4 text-sm"
              >
                New announcement
              </Link>
            </CardContent>
          </Card>
        </Section>

        <Section title="Tools">
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/admin/affiliates">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Affiliates</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Create and manage affiliate profiles, referral codes, and payout status.
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/moderation">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Moderation</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Review reported messages and manage community reports.
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/integrations">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  External API diagnostics: WooCommerce, ShipStation, Square.
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/backfill">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>WooCommerce backfill</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Import historical customers and orders; last run &amp; progress on the page.
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/mappings">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Customer mappings</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Matched vs unmatched counts, diagnostics, manual mapping.
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/exercises">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Exercise library</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  {stats.exerciseCount.toLocaleString()} exercises — descriptions &amp; display order.
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/product-sync">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Product sync</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  {stats.productCount.toLocaleString()} products in catalog — run WooCommerce sync.
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/sync">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Sync & status</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  ShipStation shipment sync and Square lookups.
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/notifications">
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Notification test</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Preview and send test emails.
                </CardContent>
              </Card>
            </Link>
            <Link href={ROUTES.adminRewards}>
              <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>Reward points</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Manually add or remove points for any user (ledger entry).
                </CardContent>
              </Card>
            </Link>
          </div>
        </Section>

        <p className="text-sm">
          <Link href={ROUTES.dashboard} className="text-primary-600 hover:underline">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </>
  );
}
