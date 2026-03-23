import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { CheckInStreaks } from "@/lib/check-ins";
import type { ExercisePR } from "@/lib/exercise-history";

/** Compact stat chips — glanceable, not a full analytics grid. */
export function DashboardQuickPulse({
  checkInStreaks,
  rewardBalance,
  recentPR,
}: {
  checkInStreaks: CheckInStreaks;
  rewardBalance: number;
  recentPR: ExercisePR | null;
}) {
  const prLabel = recentPR
    ? `${recentPR.exerciseName.split(" ").slice(0, 2).join(" ")}${recentPR.exerciseName.split(" ").length > 2 ? "…" : ""}`
    : null;

  return (
    <section aria-label="Quick stats" className="space-y-2">
      <p className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Pulse
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Link
          href={`${ROUTES.dashboard}#daily-checkin`}
          scroll
          className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 px-3 py-3 text-center active:scale-[0.98] transition-transform"
        >
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Check-in</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">
            {checkInStreaks.currentStreak}
          </p>
          <p className="text-[10px] text-zinc-500">streak</p>
        </Link>
        <Link
          href={ROUTES.rewards}
          className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 px-3 py-3 text-center active:scale-[0.98] transition-transform"
        >
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Points</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">{rewardBalance}</p>
          <p className="text-[10px] text-zinc-500">balance</p>
        </Link>
        <Link
          href={ROUTES.training}
          className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 px-3 py-3 text-center active:scale-[0.98] transition-transform min-w-0"
        >
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">PR</p>
          {recentPR ? (
            <>
              <p className="mt-1 text-xs font-semibold text-zinc-100 truncate px-0.5">
                {recentPR.maxWeight} kg
              </p>
              <p className="text-[10px] text-zinc-500 truncate">{prLabel}</p>
            </>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">—</p>
          )}
        </Link>
      </div>
    </section>
  );
}
