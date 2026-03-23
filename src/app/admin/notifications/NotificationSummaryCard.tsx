import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { NotificationLogSummary } from "@/lib/notification-log";

interface NotificationSummaryCardProps {
  summary: NotificationLogSummary;
  label: string;
}

export function NotificationSummaryCard({ summary, label }: NotificationSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-green-600 dark:text-green-400">
            Sent: <strong>{summary.sent}</strong>
          </span>
          <span className="text-red-600 dark:text-red-400">
            Failed: <strong>{summary.failed}</strong>
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            Skipped: <strong>{summary.skipped}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
