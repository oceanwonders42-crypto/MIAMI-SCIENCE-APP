"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemPointsAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { REDEMPTION_OPTIONS } from "@/lib/constants";
import { getRewardOptionIcon } from "@/components/rewards/reward-option-icons";
import { cn } from "@/lib/utils";

interface RedemptionBlockProps {
  balance: number;
}

export function RedemptionBlock({ balance }: RedemptionBlockProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRedeem(optionId: string) {
    setError(null);
    setSuccess(false);
    setLoadingId(optionId);
    const result = await redeemPointsAction(optionId);
    setLoadingId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <Card className="border-zinc-800/80 bg-zinc-950/30">
      <CardHeader>
        <CardTitle className="text-base">Redeem</CardTitle>
        <p className="text-sm text-zinc-400">
          Available balance: <span className="text-zinc-200 font-semibold tabular-nums">{balance}</span>{" "}
          pts
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-400">
            Redemption recorded. Your perk will be applied at checkout or sent by email — contact
            support if you have questions.
          </p>
        )}
        <ul className="space-y-4">
          {REDEMPTION_OPTIONS.map((opt) => {
            const Icon = getRewardOptionIcon(opt.id);
            const unlocked = balance >= opt.points;
            const needed = Math.max(0, opt.points - balance);
            const progressPct = Math.min(100, (balance / opt.points) * 100);

            return (
              <li key={opt.id}>
                <div
                  className={cn(
                    "rounded-xl border p-4 transition-all duration-300",
                    unlocked
                      ? "border-emerald-500/45 bg-emerald-950/25 shadow-[0_0_28px_-8px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/20"
                      : "border-zinc-800 bg-zinc-900/50 opacity-[0.88] grayscale-[0.15]"
                  )}
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                        unlocked
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                          : "border-zinc-700 bg-zinc-800/80 text-zinc-500"
                      )}
                      aria-hidden
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p
                            className={cn(
                              "font-semibold leading-snug",
                              unlocked ? "text-zinc-50" : "text-zinc-400"
                            )}
                          >
                            {opt.label}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">{opt.description}</p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums",
                            unlocked
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-zinc-700 text-zinc-500"
                          )}
                        >
                          {opt.points} pts
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-[11px] uppercase tracking-wide text-zinc-500">
                          <span>Progress</span>
                          <span className="tabular-nums text-zinc-400">
                            {Math.min(balance, opt.points)} / {opt.points}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              unlocked ? "bg-emerald-500/90" : "bg-zinc-600"
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        {!unlocked && (
                          <p className="text-xs text-zinc-500">
                            <span className="font-medium text-zinc-400">{needed} more points</span>{" "}
                            needed
                          </p>
                        )}
                        {unlocked && (
                          <p className="text-xs font-medium text-emerald-400/95">Ready to redeem</p>
                        )}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRedeem(opt.id)}
                          disabled={!unlocked || loadingId !== null}
                          className={cn(
                            "rounded-lg font-semibold py-2 px-4 text-sm transition-colors",
                            unlocked
                              ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-50"
                              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          )}
                        >
                          {loadingId === opt.id ? "Processing…" : "Redeem"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-zinc-500">
          Redemptions are logged below. Contact Miami Science support for codes or checkout help.
        </p>
      </CardContent>
    </Card>
  );
}
