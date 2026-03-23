import { Card, CardContent } from "@/components/ui/Card";
import type { OrderRetentionSummary } from "@/lib/order-retention";

interface OrderRetentionSummaryCardProps {
  summary: OrderRetentionSummary;
}

export function OrderRetentionSummaryCard({ summary }: OrderRetentionSummaryCardProps) {
  if (summary.orderCount === 0) return null;

  const lastOrderLabel =
    summary.lastOrderDate != null
      ? new Date(summary.lastOrderDate + "T12:00:00Z").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";
  const daysAgo =
    summary.daysSinceLastOrder != null
      ? summary.daysSinceLastOrder === 0
        ? "Today"
        : summary.daysSinceLastOrder === 1
          ? "1 day ago"
          : `${summary.daysSinceLastOrder} days ago`
      : null;

  return (
    <Card>
      <CardContent className="pt-4 space-y-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Last order: {lastOrderLabel}
          {daysAgo != null && (
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              {" "}
              · {daysAgo}
            </span>
          )}
        </p>
        {summary.avgDaysBetweenOrders != null && summary.orderCount >= 2 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Typical reorder: ~{summary.avgDaysBetweenOrders} days
          </p>
        )}
      </CardContent>
    </Card>
  );
}
