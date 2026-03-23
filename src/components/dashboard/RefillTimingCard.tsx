import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { getRefillSummary } from "@/lib/refill-timing";
import type { Supply } from "@/types";

interface RefillTimingCardProps {
  supplies: Supply[];
}

export function RefillTimingCard({ supplies }: RefillTimingCardProps) {
  const summary = getRefillSummary(supplies);
  const hasAction =
    summary.lowCount > 0 ||
    summary.criticalCount > 0 ||
    summary.reorderSoonCount > 0;

  if (supplies.length === 0) return null;
  if (
    summary.lowCount === 0 &&
    summary.criticalCount === 0 &&
    summary.reorderSoonCount === 0 &&
    !summary.nextRunoutDate
  ) {
    return null;
  }

  return (
    <Card
      className={
        summary.criticalCount > 0
          ? "border-red-200 dark:border-red-900"
          : summary.lowCount > 0
            ? "border-amber-200 dark:border-amber-800"
            : undefined
      }
    >
      <CardHeader>
        <CardTitle className="text-base">Refill timing</CardTitle>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          When to reorder based on your supply and usage
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {(summary.criticalCount > 0 || summary.lowCount > 0) && (
          <p className="text-sm font-medium">
            {summary.criticalCount > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {summary.criticalCount} item{summary.criticalCount !== 1 ? "s" : ""} very low or out.
              </span>
            )}
            {summary.criticalCount > 0 && summary.lowCount > 0 && " "}
            {summary.lowCount > 0 && (
              <span className="text-amber-700 dark:text-amber-400">
                {summary.lowCount} more below threshold.
              </span>
            )}
          </p>
        )}
        {summary.reorderSoonCount > 0 && summary.lowCount === 0 && summary.criticalCount === 0 && (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {summary.reorderSoonCount} item{summary.reorderSoonCount !== 1 ? "s" : ""} running low in the next couple of weeks.
          </p>
        )}
        {summary.nextRunoutDate && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Next estimated runout:{" "}
            {new Date(summary.nextRunoutDate + "T12:00:00Z").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {summary.nextRunoutSupplyName && ` (${summary.nextRunoutSupplyName})`}.
          </p>
        )}
        {summary.recommendedReorderByDate && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Recommended: place a reorder by{" "}
            {new Date(summary.recommendedReorderByDate + "T12:00:00Z").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}{" "}
            to stay stocked.
          </p>
        )}
        {hasAction && (
          <Link
            href={ROUTES.stack}
            className="inline-block text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            View Stack and refill →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
