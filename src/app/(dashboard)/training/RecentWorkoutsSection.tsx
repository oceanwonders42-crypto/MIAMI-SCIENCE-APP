import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { Workout } from "@/types";
import type { WorkoutEntry } from "@/types";
import type { ExercisePR } from "@/lib/exercise-history";

interface RecentWorkoutsSectionProps {
  workouts: Workout[];
  entriesByWorkout: Map<string, WorkoutEntry[]>;
  prs: ExercisePR[];
}

export function RecentWorkoutsSection({
  workouts,
  entriesByWorkout,
  prs,
}: RecentWorkoutsSectionProps) {
  if (workouts.length === 0) {
    return (
      <section>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Recent</h3>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm text-zinc-500">No workouts yet. Start one above.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Recent</h3>
      <ul className="space-y-2">
        {workouts.map((w) => {
          const entries = entriesByWorkout.get(w.id) ?? [];
          const date = new Date(w.started_at).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          return (
            <li key={w.id}>
              <Link
                href={ROUTES.trainingWorkout(w.id)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 min-h-[56px] hover:border-zinc-700 hover:bg-zinc-800/80 active:scale-[0.99] transition-all touch-manipulation"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-zinc-100 block truncate">
                    {w.workout_type ?? w.name ?? "Workout"}
                  </span>
                  <span className="text-zinc-500 text-sm">{date}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {w.duration_minutes != null && (
                    <span className="text-xs text-zinc-500 tabular-nums">{w.duration_minutes}m</span>
                  )}
                  <span className="text-zinc-400 text-sm tabular-nums">
                    {entries.length}
                  </span>
                  <span className="text-primary-400" aria-hidden>→</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
