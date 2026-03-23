import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stats } from "@/components/ui/Stats";
import { ROUTES } from "@/lib/constants";
import type { WeeklyRecapData } from "@/lib/weekly-recap";

interface WeeklyRecapBlockProps {
  data: WeeklyRecapData;
}

function refillUrgencyLabel(urgency: WeeklyRecapData["refillUrgency"]): string | null {
  switch (urgency) {
    case "critical":
      return "Reorder now";
    case "low":
      return "Low supply";
    case "soon":
      return "Reorder soon";
    default:
      return null;
  }
}

export function WeeklyRecapBlock({ data }: WeeklyRecapBlockProps) {
  const weekLabel =
    new Date(data.weekStart + "T12:00:00Z").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }) +
    " – " +
    new Date(data.weekEnd + "T12:00:00Z").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">This week</CardTitle>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{weekLabel}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stats label="Workouts" value={data.workoutsThisWeek} />
          <Stats label="Check-ins" value={data.checkInsThisWeek} />
          <Stats label="Check-in streak" value={`${data.checkInStreak} days`} />
          <Stats label="Workout streak" value={`${data.workoutStreak} days`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stats
            label="Low supply items"
            value={data.lowSupplyCount}
            subtitle={data.lowSupplyCount > 0 ? "Consider reordering" : undefined}
          />
          <Stats
            label="Points change"
            value={
              data.pointsChangeThisWeek >= 0
                ? `+${data.pointsChangeThisWeek}`
                : `${data.pointsChangeThisWeek}`
            }
            subtitle={`Balance: ${data.pointsBalance} pts`}
          />
        </div>
        {(data.lastOrderDate != null || data.refillUrgency !== "none" || (data.avgDaysBetweenOrders != null && data.avgDaysBetweenOrders > 0)) && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-700">
            {data.lastOrderDate != null && (
              <Stats
                label="Last order"
                value={new Date(data.lastOrderDate + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                subtitle={data.daysSinceLastOrder != null ? `${data.daysSinceLastOrder} days ago` : undefined}
              />
            )}
            {data.refillUrgency !== "none" && (
              <Stats
                label="Refill"
                value={refillUrgencyLabel(data.refillUrgency) ?? "—"}
                subtitle="View stack to reorder"
              />
            )}
            {data.avgDaysBetweenOrders != null && data.avgDaysBetweenOrders > 0 && (
              <Stats
                label="Typical reorder"
                value={`~${data.avgDaysBetweenOrders} days`}
                subtitle="Based on your order history"
              />
            )}
          </div>
        )}
        <Link
          href={ROUTES.dashboard}
          className="inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          View full dashboard →
        </Link>
      </CardContent>
    </Card>
  );
}
