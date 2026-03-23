import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Stats } from "@/components/ui/Stats";
import { ROUTES } from "@/lib/constants";
import type { WorkoutStats } from "@/lib/workouts";
import type { ExercisePR } from "@/lib/exercise-history";

interface TrainingProgressBlockProps {
  workoutStats: WorkoutStats;
  recentPR: ExercisePR | null;
  lastBodyweightKg?: number | null;
}

export function TrainingProgressBlock({
  workoutStats,
  recentPR,
  lastBodyweightKg = null,
}: TrainingProgressBlockProps) {
  const lastWorkoutFormatted = workoutStats.lastWorkoutDate
    ? new Date(workoutStats.lastWorkoutDate + "Z").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Stats label="Last workout" value={lastWorkoutFormatted} />
          <Stats
            label="Streak"
            value={`${workoutStats.currentStreak} day${workoutStats.currentStreak !== 1 ? "s" : ""}`}
          />
          <Stats
            label="This week"
            value={workoutStats.workoutsThisWeek}
            subtitle="workouts"
          />
          <Stats
            label="Bodyweight"
            value={lastBodyweightKg != null ? `${lastBodyweightKg} kg` : "—"}
          />
          {recentPR ? (
            <Stats
              label="Recent PR"
              value={`${recentPR.exerciseName}: ${recentPR.maxWeight} kg`}
              subtitle={new Date(recentPR.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              valueClassName="truncate"
            />
          ) : (
            <Stats label="Recent PR" value="—" />
          )}
        </div>
        <Link
          href={ROUTES.training}
          className="mt-3 inline-block text-sm font-medium text-primary-500 dark:text-primary-400 hover:underline"
        >
          Training →
        </Link>
      </CardContent>
    </Card>
  );
}
