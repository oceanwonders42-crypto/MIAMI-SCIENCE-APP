import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getRecentNotificationLogs, getNotificationLogSummary, getRecentFailedLogs } from "@/lib/notification-log";
import { Header } from "@/components/layout/Header";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { NotificationTestClient } from "./NotificationTestClient";
import { NotificationSummaryCard } from "./NotificationSummaryCard";
import { NotificationLogTable } from "./NotificationLogTable";

function last24hIso(): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - 24);
  return d.toISOString();
}

export default async function AdminNotificationsPage() {
  const supabase = await createServerClient();
  const [recentLogs, summary24h, recentFailed] = await Promise.all([
    getRecentNotificationLogs(supabase, 100),
    getNotificationLogSummary(supabase, last24hIso()),
    getRecentFailedLogs(supabase, 20),
  ]);

  return (
    <>
      <Header title="Notification test" subtitle="Preview, send test emails, and view log" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Diagnostics">
          <NotificationTestClient />
        </Section>
        <Section title="Last 24 hours">
          <NotificationSummaryCard summary={summary24h} label="Run summary" />
        </Section>
        {recentFailed.length > 0 && (
          <Section title="Recent failed sends">
            <NotificationLogTable entries={recentFailed} />
          </Section>
        )}
        <Section title="Recent sends">
          <NotificationLogTable entries={recentLogs} />
        </Section>
        <p className="text-sm">
          <Link href={ROUTES.admin} className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to admin
          </Link>
        </p>
      </div>
    </>
  );
}
