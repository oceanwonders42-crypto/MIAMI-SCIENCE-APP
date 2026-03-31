import Link from "next/link";
import { CheckInCard } from "@/components/dashboard/CheckInCard";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { ROUTES } from "@/lib/constants";
import type { CheckIn } from "@/types";
import type { CheckInStreaks } from "@/lib/check-ins";
import type { WorkoutStats } from "@/lib/workouts";

interface TodayBlockProps {
  todayCheckIn: CheckIn | null;
  checkInDateYmd: string;
  checkInStreaks: CheckInStreaks;
  workoutStats: WorkoutStats;
}

export function TodayBlock({
  todayCheckIn,
  checkInDateYmd,
  checkInStreaks,
  workoutStats,
}: TodayBlockProps) {
  const hasCheckedIn = todayCheckIn != null;
  const primaryCtaLabel = hasCheckedIn ? "Log workout" : "Complete check-in";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-5">
      <div className="grid gap-6 md:grid-cols-2">
        <CheckInCard todayCheckIn={todayCheckIn} checkInDateYmd={checkInDateYmd} embedded />
        <StreakCard checkInStreaks={checkInStreaks} workoutStats={workoutStats} embedded />
      </div>
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <Link
          href={ROUTES.training}
          className="block w-full rounded-xl bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-3 px-4 text-center text-sm transition-colors"
        >
          {primaryCtaLabel}
        </Link>
      </div>
    </div>
  );
}
