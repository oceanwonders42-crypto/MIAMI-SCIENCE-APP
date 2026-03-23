import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { Workout } from "@/types";
import type { WorkoutEntry } from "@/types";

interface WorkoutHistoryTimelineProps {
  workouts: Workout[];
  entriesByWorkout: Map<string, WorkoutEntry[]>;
}

/** Vertical timeline — cleaner than stacked cards for history. */
export function WorkoutHistoryTimeline({
  workouts,
  entriesByWorkout,
}: WorkoutHistoryTimelineProps) {
  if (workouts.length === 0) {
    return (
      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 px-0.5">
          History
        </p>
        <div className="rounded-[1.25rem] border border-white/[0.06] bg-zinc-900/30 py-10 text-center">
          <p className="text-sm text-zinc-500">No workouts yet</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 px-0.5">
        History
      </p>
      <ol className="space-y-0">
        {workouts.map((w, i) => {
          const entries = entriesByWorkout.get(w.id) ?? [];
          const date = new Date(w.started_at);
          const dateStr = date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const timeStr = date.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          });
          const isLast = i === workouts.length - 1;
          return (
            <li key={w.id} className="relative flex gap-3">
              <div className="flex w-4 shrink-0 flex-col items-center pt-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90 ring-2 ring-zinc-950 z-10" />
                {!isLast && (
                  <div className="w-px flex-1 min-h-[12px] bg-emerald-500/20 -mt-0.5" aria-hidden />
                )}
              </div>
              <Link
                href={ROUTES.trainingWorkout(w.id)}
                className="mb-3 flex-1 min-w-0 rounded-2xl border border-white/[0.06] bg-zinc-900/40 px-4 py-3.5 hover:bg-zinc-900/65 active:scale-[0.99] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-100 truncate">
                      {w.workout_type ?? w.name ?? "Workout"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {dateStr} · {timeStr}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums text-zinc-300">{entries.length}</p>
                    <p className="text-[10px] text-zinc-500">moves</p>
                  </div>
                </div>
                {entries.length > 0 && i === 0 && (
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                    {entries
                      .slice(0, 3)
                      .map((e) => e.exercise_name)
                      .join(" · ")}
                    {entries.length > 3 ? "…" : ""}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
