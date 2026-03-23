import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { WorkoutStats } from "@/lib/workouts";
import type { CheckInStreaks } from "@/lib/check-ins";
import type { ExercisePR } from "@/lib/exercise-history";

/** Moody gym floor / equipment — Unsplash (free use). */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1920&q=85";

const MOTIVATIONAL_LINES = [
  "Own every rep.",
  "Stronger than yesterday.",
  "Build the habit. Earn the edge.",
  "Your session starts now.",
  "Consistency beats intensity.",
  "Train like it matters — because it does.",
  "Progress is earned, not given.",
  "Show up. Lock in. Level up.",
];

function partOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function pickMotivation(displayName: string): string {
  const seed = displayName.length + dayOfYear();
  return MOTIVATIONAL_LINES[seed % MOTIVATIONAL_LINES.length];
}

/**
 * Premium gym-app hero: full-bleed imagery, bold welcome, glass quick stats.
 */
export function DashboardHero({
  displayName,
  workoutStats,
  checkInStreaks,
  rewardBalance,
  recentPR,
}: {
  displayName: string;
  workoutStats: WorkoutStats;
  checkInStreaks: CheckInStreaks;
  rewardBalance: number;
  recentPR: ExercisePR | null;
}) {
  const tagline = pickMotivation(displayName);
  const prShort = recentPR
    ? `${recentPR.exerciseName.split(" ").slice(0, 2).join(" ")}${recentPR.exerciseName.split(" ").length > 2 ? "…" : ""}`
    : null;

  return (
    <section
      aria-label="Welcome"
      className="relative isolate min-h-[min(42vh,380px)] md:min-h-[min(46vh,420px)] w-full overflow-hidden border-b border-white/[0.06]"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_65%] scale-105 md:scale-100"
      />
      {/* Readability layers */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-transparent to-zinc-950/70"
        aria-hidden
      />
      {/* Subtle “energy” accent */}
      <div
        className="pointer-events-none absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-400/70 to-transparent opacity-80 animate-pulse"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[inherit] flex-col justify-end px-4 pb-8 pt-14 md:px-8 md:pb-10 max-w-5xl mx-auto w-full">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300/90 drop-shadow-sm">
          {partOfDay()}
        </p>
        <h1 className="mt-2 text-[2.35rem] sm:text-5xl md:text-6xl font-black tracking-[-0.04em] text-white leading-[0.95] drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
          {displayName}
        </h1>
        <p className="mt-3 max-w-lg text-base sm:text-lg font-semibold text-zinc-200/95 leading-snug">
          {tagline}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
          <Link
            href={ROUTES.training}
            className="group rounded-2xl border border-white/[0.12] bg-black/35 px-3.5 py-3 backdrop-blur-md transition-colors hover:border-primary-400/35 hover:bg-black/45 active:scale-[0.99]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-primary-300/90">
              Streak
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-white">
              {workoutStats.currentStreak}
            </p>
            <p className="text-[11px] font-medium text-zinc-400">workout days</p>
          </Link>
          <Link
            href={ROUTES.training}
            className="group rounded-2xl border border-white/[0.12] bg-black/35 px-3.5 py-3 backdrop-blur-md transition-colors hover:border-primary-400/35 hover:bg-black/45 active:scale-[0.99]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-primary-300/90">
              This week
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-emerald-300">
              {workoutStats.workoutsThisWeek}
            </p>
            <p className="text-[11px] font-medium text-zinc-400">sessions</p>
          </Link>
          <Link
            href={ROUTES.rewards}
            className="group rounded-2xl border border-white/[0.12] bg-black/35 px-3.5 py-3 backdrop-blur-md transition-colors hover:border-primary-400/35 hover:bg-black/45 active:scale-[0.99]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-primary-300/90">
              Points
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-primary-200">
              {rewardBalance}
            </p>
            <p className="text-[11px] font-medium text-zinc-400">rewards balance</p>
          </Link>
          <Link
            href={`${ROUTES.dashboard}#daily-checkin`}
            scroll
            className="group rounded-2xl border border-white/[0.12] bg-black/35 px-3.5 py-3 backdrop-blur-md transition-colors hover:border-primary-400/35 hover:bg-black/45 active:scale-[0.99] min-w-0"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-primary-300/90">
              Check-in
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-white">
              {checkInStreaks.currentStreak}
            </p>
            <p className="text-[11px] font-medium text-zinc-400">
              day streak
              {checkInStreaks.longestStreak > 0 ? (
                <span className="text-zinc-500"> · best {checkInStreaks.longestStreak}</span>
              ) : null}
            </p>
          </Link>
        </div>

        {recentPR ? (
          <Link
            href={ROUTES.training}
            className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/[0.1] bg-black/30 px-4 py-2 text-xs font-semibold text-zinc-200 backdrop-blur-md hover:border-primary-400/30 hover:text-white transition-colors"
          >
            <span className="text-primary-300">PR</span>
            <span className="tabular-nums">{recentPR.maxWeight} kg</span>
            <span className="truncate text-zinc-400">{prShort}</span>
          </Link>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.training}
            className="inline-flex items-center justify-center rounded-2xl bg-primary-400 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-primary-900/30 hover:bg-primary-300 active:scale-[0.99] transition-colors"
          >
            {workoutStats.lastWorkoutDate ? "Train now" : "Start training"}
          </Link>
          <Link
            href={ROUTES.trainingBrowse}
            className="text-sm font-semibold text-zinc-300 underline-offset-4 hover:text-white hover:underline"
          >
            Browse exercises
          </Link>
        </div>
      </div>
    </section>
  );
}
