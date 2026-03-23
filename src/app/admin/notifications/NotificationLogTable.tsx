import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { NotificationLogEntry } from "@/lib/notification-log";

interface NotificationLogTableProps {
  entries: NotificationLogEntry[];
}

export function NotificationLogTable({ entries }: NotificationLogTableProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No notification log entries yet. Run the cron job or send test emails to see entries here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent sends</CardTitle>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Last {entries.length} entries. No secrets or emails shown.
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-2 pr-4 font-medium text-zinc-700 dark:text-zinc-300">Time</th>
              <th className="text-left py-2 pr-4 font-medium text-zinc-700 dark:text-zinc-300">Source</th>
              <th className="text-left py-2 pr-4 font-medium text-zinc-700 dark:text-zinc-300">Type</th>
              <th className="text-left py-2 pr-4 font-medium text-zinc-700 dark:text-zinc-300">Channel</th>
              <th className="text-left py-2 pr-4 font-medium text-zinc-700 dark:text-zinc-300">Status</th>
              <th className="text-left py-2 pr-4 font-medium text-zinc-700 dark:text-zinc-300">User ID</th>
              <th className="text-left py-2 font-medium text-zinc-700 dark:text-zinc-300">Reason</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const isTest = e.reason != null && e.reason.startsWith("Test send");
              return (
                <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={isTest ? "text-amber-600 dark:text-amber-400 text-xs font-medium" : "text-zinc-500 dark:text-zinc-400 text-xs"}>
                      {isTest ? "Test" : "Scheduled"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{e.notification_type}</td>
                  <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{e.channel}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        e.status === "sent"
                          ? "text-green-600 dark:text-green-400"
                          : e.status === "failed"
                            ? "text-red-600 dark:text-red-400"
                            : "text-zinc-500 dark:text-zinc-400"
                      }
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">
                    {e.user_id}
                  </td>
                  <td className="py-2 text-zinc-500 dark:text-zinc-400 text-xs max-w-[200px] truncate" title={e.reason ?? undefined}>
                    {e.reason ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
