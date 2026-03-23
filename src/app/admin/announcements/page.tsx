import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { listAnnouncementsAdmin } from "./actions";
import { AnnouncementRowActions } from "./AnnouncementRowActions";

export default async function AdminAnnouncementsPage() {
  const rows = await listAnnouncementsAdmin();
  const now = Date.now();

  return (
    <>
      <Header title="Announcements" subtitle="Create, publish, and manage dashboard announcements" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <div className="flex justify-end">
          <Link
            href={`${ROUTES.adminAnnouncements}/new`}
            className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 text-sm"
          >
            New announcement
          </Link>
        </div>
        <Section title="All announcements">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Library</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="p-2 font-medium">Title</th>
                    <th className="p-2 font-medium">Status</th>
                    <th className="p-2 font-medium">Published</th>
                    <th className="p-2 font-medium w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => {
                    const pub = a.published_at ? new Date(a.published_at).getTime() : null;
                    let status = "Draft";
                    if (pub != null) {
                      status = pub <= now ? "Live" : "Scheduled";
                    }
                    return (
                      <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="p-2 font-medium text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                          {a.title}
                        </td>
                        <td className="p-2 text-zinc-600 dark:text-zinc-400">{status}</td>
                        <td className="p-2 text-zinc-500 text-xs">
                          {a.published_at
                            ? new Date(a.published_at).toLocaleString(undefined, {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                        <td className="p-2">
                          <AnnouncementRowActions announcement={a} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="text-sm text-zinc-500 py-6 text-center">No announcements yet.</p>
              )}
            </CardContent>
          </Card>
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
