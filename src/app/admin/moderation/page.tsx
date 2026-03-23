import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { getModerationReports } from "@/lib/moderation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { ReportActions } from "./ReportActions";
import { ROUTES } from "@/lib/constants";

export default async function AdminModerationPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect(ROUTES.dashboard);

  const reports = await getModerationReports(supabase);

  return (
    <>
      <Header title="Moderation" subtitle="Reported messages" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Reports">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No reports yet.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-4">
              {reports.map((r) => (
                <li key={r.id}>
                  <Card>
                    <CardContent className="py-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge
                          variant={
                            r.status === "pending" ? "warning" : "default"
                          }
                        >
                          {r.status}
                        </Badge>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                        {r.status === "pending" && (
                          <ReportActions reportId={r.id} />
                        )}
                      </div>
                      {(r.reporter_display_name != null || r.room_name != null) && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {r.reporter_display_name != null && (
                            <>Reported by: {r.reporter_display_name}</>
                          )}
                          {r.reporter_display_name != null && r.room_name != null && " · "}
                          {r.room_name != null && <>Room: {r.room_name}</>}
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Reason:{" "}
                        </span>
                        {r.reason}
                      </p>
                      {r.chat_messages && (
                        <div className="rounded bg-zinc-100 dark:bg-zinc-800 p-2 text-sm text-zinc-700 dark:text-zinc-300">
                          {r.chat_messages.content}
                        </div>
                      )}
                      {r.room_slug != null && (
                        <p className="text-sm">
                          <Link
                            href={`/community?room=${encodeURIComponent(r.room_slug)}`}
                            className="text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            View in context →
                          </Link>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <p className="text-sm">
          <Link
            href={ROUTES.admin}
            className="text-primary-600 hover:underline"
          >
            ← Back to admin
          </Link>
        </p>
      </div>
    </>
  );
}
