import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { WorkoutStats } from "@/lib/workouts";
import type { Workout } from "@/types";

/**
 * Primary dashboard focus: training streak + CTA (Whoop / Apple Fitness–inspired hierarchy).
 */
export function DashboardWorkoutToday({
  workoutStats,
  lastWorkout,
}: {
  workoutStats: WorkoutStats;
  lastWorkout: Workout | null;
}) {
  const lastLabel = workoutStats.lastWorkoutDate
    ? new Date(workoutStats.lastWorkoutDate + "Z").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;
  const sessionName = lastWorkout?.name?.trim();

  return (
    <section
      aria-label="Today’s workout"
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-950 p-5 sm:p-6 shadow-2xl shadow-black/40 ring-1 ring-primary-500/10"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-400/80">
            Training focus
          </p>
          <p className="mt-2 text-5xl sm:text-6xl font-black tabular-nums tracking-tighter text-white leading-none">
            {workoutStats.currentStreak}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-400">day streak</p>
        </div>
        <div className="shrink-0 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.12] px-4 py-3 text-right shadow-inner shadow-emerald-950/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
            This week
          </p>
          <p className="text-2xl font-black tabular-nums text-emerald-50">
            {workoutStats.workoutsThisWeek}
          </p>
          <p className="text-[10px] font-medium text-emerald-200/55">sessions</p>
        </div>
      </div>

      <div className="relative mt-5 rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Last session</p>
        {lastLabel ? (
          <>
            <p className="text-sm text-zinc-200">{lastLabel}</p>
            {sessionName ? (
              <p className="text-xs text-zinc-500 truncate mt-0.5">{sessionName}</p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-zinc-400">No sessions logged yet</p>
        )}
      </div>

      <Link
        href={ROUTES.training}
        className="relative mt-5 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-4 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-950/40 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] transition-all"
      >
        {workoutStats.lastWorkoutDate ? "Open workout log" : "Start your first session"}
      </Link>
      <Link
        href={ROUTES.trainingBrowse}
        className="mt-3 block text-center text-xs font-semibold text-zinc-500 hover:text-primary-300 transition-colors"
      >
        Browse exercises →
      </Link>
    </section>
  );
}
