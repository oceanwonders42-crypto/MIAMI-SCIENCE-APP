import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { getRefillTiming } from "@/lib/refill-timing";
import type { Supply } from "@/types";

interface RunoutForecastCardProps {
  supplies: Supply[];
}

export function RunoutForecastCard({ supplies }: RunoutForecastCardProps) {
  const timings = supplies
    .map(getRefillTiming)
    .filter(
      (t) =>
        t.daysLeft != null || t.status === "low" || t.status === "critical"
    );
  if (timings.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Supply runout</CardTitle>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Estimated from your daily use
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-2">
          {timings.map((t) => (
            <li
              key={t.supply.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span className="font-medium">{t.supply.name}</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {t.message}
                {t.reorderByDate && (
                  <> · Order by {new Date(t.reorderByDate + "T12:00:00Z").toLocaleDateString()}</>
                )}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href={ROUTES.stack}
          className="inline-block mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          Update quantities in Stack →
        </Link>
      </CardContent>
    </Card>
  );
}
