import { Gift, PlusCircle, SlidersHorizontal } from "lucide-react";
import type { RewardPointsLedgerEntry } from "@/types";
import { getLedgerEntryLabel, getLedgerEntryType } from "@/lib/rewards";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RewardsHistoryTimeline({
  entries,
}: {
  entries: RewardPointsLedgerEntry[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center py-10">
        No activity yet. Earn points on qualifying purchases and activities — they&apos;ll show up
        here.
      </p>
    );
  }

  return (
    <div className="relative pl-2">
      <ul className="space-y-0">
        {entries.map((entry, index) => {
          const type = getLedgerEntryType(entry);
          const label = getLedgerEntryLabel(entry);
          const isPositive = entry.amount_delta > 0;
          const isLast = index === entries.length - 1;

          const Icon =
            type === "earned" ? PlusCircle : type === "redeemed" ? Gift : SlidersHorizontal;
          const iconWrap =
            type === "earned"
              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
              : type === "redeemed"
                ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                : "border-zinc-600 bg-zinc-800 text-zinc-400";

          return (
            <li key={entry.id} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[17px] top-10 bottom-0 w-px bg-zinc-800"
                  aria-hidden
                />
              )}
              <div
                className={`relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${iconWrap}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5 space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-medium text-zinc-100 leading-snug">{label}</p>
                  <span
                    className={`tabular-nums text-sm font-semibold shrink-0 ${
                      isPositive
                        ? "text-emerald-400"
                        : type === "redeemed"
                          ? "text-amber-200/95"
                          : "text-zinc-400"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {entry.amount_delta} pts
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{formatWhen(entry.created_at)}</p>
                {entry.description?.trim() && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{entry.description}</p>
                )}
                <p className="text-[11px] uppercase tracking-wider text-zinc-600">
                  {type === "earned"
                    ? "Earned"
                    : type === "redeemed"
                      ? "Redeemed"
                      : "Adjustment"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
