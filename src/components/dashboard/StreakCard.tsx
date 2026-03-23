import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Stats } from "@/components/ui/Stats";
import { ROUTES } from "@/lib/constants";
import type { CheckInStreaks } from "@/lib/check-ins";
import type { WorkoutStats } from "@/lib/workouts";

interface StreakCardProps {
  checkInStreaks: CheckInStreaks;
  workoutStats: WorkoutStats;
  /** When true, render without Card wrapper (e.g. inside TodayBlock hero). */
  embedded?: boolean;
}

export function StreakCard({ checkInStreaks, workoutStats, embedded }: StreakCardProps) {
  const { currentStreak: checkInStreak, longestStreak } = checkInStreaks;
  const workoutStreak = workoutStats.currentStreak;

  const content = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Stats
          label="Check-in streak"
          value={`${checkInStreak} day${checkInStreak !== 1 ? "s" : ""}`}
          subtitle={longestStreak > 0 ? `Longest: ${longestStreak} days` : undefined}
        />
        <Stats
          label="Workout streak"
          value={`${workoutStreak} day${workoutStreak !== 1 ? "s" : ""}`}
        />
      </div>
      {!embedded && (
        <Link
          href={ROUTES.dashboard}
          className="inline-block mt-2 text-sm text-primary-500 dark:text-primary-400 hover:underline"
        >
          Check in daily to keep your streak →
        </Link>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Streaks</h3>
        {content}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">{content}</CardContent>
    </Card>
  );
}
