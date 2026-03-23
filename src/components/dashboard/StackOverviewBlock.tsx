import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Stats } from "@/components/ui/Stats";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";
import { getRefillSummary } from "@/lib/refill-timing";
import { isLowSupply, isRunningLowSoon } from "@/lib/supplies";
import type { Supply } from "@/types";

interface StackOverviewBlockProps {
  supplies: Supply[];
  /** `slim` = single-line reminder for dashboard hero flow */
  variant?: "full" | "slim";
}

export function StackOverviewBlock({ supplies, variant = "full" }: StackOverviewBlockProps) {
  const summary = getRefillSummary(supplies);
  const lowCount = supplies.filter((s) => isLowSupply(s)).length;
  const soonCount = supplies.filter((s) => isRunningLowSoon(s)).length;
  const hasAttention =
    summary.lowCount > 0 ||
    summary.criticalCount > 0 ||
    summary.reorderSoonCount > 0 ||
    summary.nextRunoutDate != null;

  if (supplies.length === 0) {
    return (
      <Card
        className={
          variant === "slim"
            ? "border-white/[0.07] bg-zinc-900/35"
            : "border-zinc-800 bg-zinc-900/50"
        }
      >
        <CardContent className={variant === "slim" ? "py-4 px-4" : "py-6 text-center"}>
          <p className="text-sm text-zinc-400 mb-2">No supplements tracked yet.</p>
          <Link
            href={ROUTES.stack}
            className="text-sm font-semibold text-teal-400/90 hover:text-teal-300"
          >
            Set up stack →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const nextRunoutLabel = summary.nextRunoutDate
    ? new Date(summary.nextRunoutDate + "T12:00:00Z").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";

  const lowTotal = lowCount + summary.criticalCount;
  const orderByLabel = summary.recommendedReorderByDate
    ? new Date(summary.recommendedReorderByDate + "T12:00:00Z").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  if (variant === "slim") {
    const tone =
      summary.criticalCount > 0
        ? "text-rose-300"
        : lowTotal > 0
          ? "text-amber-200"
          : "text-zinc-200";
    const headline =
      summary.criticalCount > 0
        ? `${summary.criticalCount} critical · reorder soon`
        : lowTotal > 0
          ? `${lowTotal} running low`
          : soonCount > 0
            ? `${soonCount} reorder within ~2 weeks`
            : "Supplies look good";
    return (
      <section aria-label="Supplement reminder" className="space-y-2">
        <p className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Supplements
        </p>
        <Card className="rounded-[1.25rem] border border-white/[0.07] border-l-[3px] border-l-teal-500/45 bg-zinc-900/35">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-sm font-medium leading-snug ${tone}`}>{headline}</p>
                {summary.nextRunoutSupplyName && (
                  <p className="text-xs text-zinc-500 mt-1 truncate">
                    Next: {summary.nextRunoutSupplyName} · {nextRunoutLabel}
                  </p>
                )}
                {orderByLabel && hasAttention && (
                  <p className="text-xs text-zinc-500 mt-1">Order by {orderByLabel}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Link
                  href={ROUTES.stack}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
                >
                  Stack
                </Link>
                <a
                  href={SHOP_REFILL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-teal-400/90 hover:text-teal-300"
                >
                  Shop
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <Card
      className={
        summary.criticalCount > 0
          ? "border-l-4 border-l-red-500/80 border-zinc-800 bg-zinc-900/50"
          : lowCount > 0
            ? "border-l-4 border-l-amber-500/80 border-zinc-800 bg-zinc-900/50"
            : hasAttention
              ? "border-l-4 border-l-primary-500/50 border-zinc-800 bg-zinc-900/50"
              : "border-zinc-800 bg-zinc-900/50"
      }
    >
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stats label="Active supplies" value={supplies.length} />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Next runout
            </p>
            <p className="text-lg font-semibold tabular-nums text-zinc-100">
              {nextRunoutLabel}
            </p>
            {summary.nextRunoutSupplyName && (
              <p className="text-xs text-zinc-400 truncate">
                {summary.nextRunoutSupplyName}
              </p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Low
            </p>
            <p
              className={
                lowTotal > 0
                  ? "text-lg font-semibold tabular-nums text-primary-500 dark:text-primary-400"
                  : "text-lg font-semibold tabular-nums text-zinc-100"
              }
            >
              {lowTotal}
            </p>
            {lowTotal > 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Need attention</p>
            )}
          </div>
          <Stats
            label="Reorder soon"
            value={soonCount}
            subtitle={soonCount > 0 ? "Within ~2 weeks" : undefined}
          />
        </div>
        {orderByLabel && hasAttention && (
          <p className="mt-3 pt-3 border-t border-zinc-700/60 text-sm">
            <span className="text-zinc-500">Order by </span>
            <span className="font-semibold text-primary-500 dark:text-primary-400">{orderByLabel}</span>
            <span className="text-zinc-500"> to stay stocked.</span>
          </p>
        )}
        <Link
          href={ROUTES.stack}
          className="mt-3 inline-block text-sm font-medium text-primary-500 dark:text-primary-400 hover:underline"
        >
          My stack →
        </Link>
      </CardContent>
    </Card>
  );
}
