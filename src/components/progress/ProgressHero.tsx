import { formatWeight } from "@/lib/units";
import type { PreferredUnits } from "@/lib/units";
import { cn } from "@/lib/utils";

/**
 * Large weight headline + short-term trend (last log vs previous).
 */
export function ProgressHero({
  lastWeightKg,
  lastWeightDate,
  recentDeltaKg,
  preferredUnits,
}: {
  lastWeightKg: number | null;
  lastWeightDate: string | null;
  recentDeltaKg: number | null;
  preferredUnits: PreferredUnits;
}) {
  const hasWeight = lastWeightKg != null && Number.isFinite(lastWeightKg);
  const deltaDisplay =
    recentDeltaKg != null && Number.isFinite(recentDeltaKg)
      ? preferredUnits === "imperial"
        ? recentDeltaKg * 2.205
        : recentDeltaKg
      : null;
  const unit = preferredUnits === "imperial" ? "lb" : "kg";

  let trendLabel = "Log twice to see your trend";
  let trendClass = "text-amber-400/90";
  let arrow: "up" | "down" | "flat" | "none" = "none";

  if (deltaDisplay != null) {
    if (Math.abs(deltaDisplay) < 0.05) {
      trendLabel = "Flat vs last log";
      trendClass = "text-amber-400/90";
      arrow = "flat";
    } else if (deltaDisplay < 0) {
      trendLabel = `${Math.abs(deltaDisplay).toFixed(1)} ${unit} vs last log`;
      trendClass = "text-emerald-400/90";
      arrow = "down";
    } else {
      trendLabel = `+${deltaDisplay.toFixed(1)} ${unit} vs last log`;
      trendClass = "text-red-400/85";
      arrow = "up";
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-emerald-950/25 p-6 sm:p-8 shadow-2xl shadow-black/40">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-400/90">Body weight</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <p
            className={cn(
              "text-5xl sm:text-6xl font-black tabular-nums tracking-tighter text-white",
              !hasWeight && "text-zinc-600"
            )}
          >
            {hasWeight ? formatWeight(lastWeightKg, preferredUnits) : "—"}
          </p>
          {hasWeight && (
            <div className={cn("flex items-center gap-2 pb-1.5", trendClass)}>
              {arrow === "down" && (
                <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 5v14M6 11l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {arrow === "up" && (
                <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 19V5M6 13l6-6 6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {arrow === "flat" && (
                <span className="text-2xl font-black text-amber-400/80" aria-hidden>
                  —
                </span>
              )}
              <span className="text-sm font-bold leading-tight max-w-[200px]">{trendLabel}</span>
            </div>
          )}
        </div>
        {lastWeightDate && hasWeight && (
          <p className="mt-2 text-xs font-medium text-zinc-500">
            Last entry ·{" "}
            {new Date(lastWeightDate).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
        {!hasWeight && (
          <p className="mt-4 text-sm text-zinc-400 max-w-md">
            Start tracking — log your weight to unlock trends, BMI, and charts built around your data.
          </p>
        )}
      </div>
    </section>
  );
}
