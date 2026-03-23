import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import type { ReminderNudge } from "@/lib/reminders";

interface ReminderNudgesProps {
  nudges: ReminderNudge[];
}

export function ReminderNudges({ nudges }: ReminderNudgesProps) {
  if (nudges.length === 0) return null;

  return (
    <div className="space-y-3">
      {nudges.map((nudge) => (
        <Card
          key={nudge.id}
          className={
            nudge.type === "low_supply"
              ? "border-amber-200 dark:border-amber-800"
              : nudge.type === "delivered_not_added" || nudge.type === "comeback" || nudge.type === "comeback_workout"
                ? "border-primary-200 dark:border-primary-800"
                : "border-zinc-200 dark:border-zinc-700"
          }
        >
          <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{nudge.title}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {nudge.message}
              </p>
            </div>
            {nudge.ctaUrl.startsWith("http") ? (
              <a
                href={nudge.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3 text-sm"
              >
                {nudge.ctaLabel}
              </a>
            ) : (
              <Link
                href={nudge.ctaUrl}
                className="shrink-0 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3 text-sm"
              >
                {nudge.ctaLabel}
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
