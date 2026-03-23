import type { WorkoutStats } from "@/lib/workouts";

interface TrainingStatsProps {
  stats: WorkoutStats;
}

export function TrainingStats({ stats }: TrainingStatsProps) {
  return (
    <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-zinc-100">{stats.workoutsThisWeek}</span>
        <span className="text-sm text-zinc-500">this week</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums text-zinc-100">{stats.currentStreak}</span>
        <span className="text-sm text-zinc-500">streak</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm text-zinc-500">Last</span>
        <span className="font-semibold text-zinc-200 tabular-nums">
          {stats.lastWorkoutDate
            ? new Date(stats.lastWorkoutDate + "Z").toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : "—"}
        </span>
      </div>
    </section>
  );
}
