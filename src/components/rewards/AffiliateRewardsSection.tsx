import { Gift, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

const FREE_PRODUCT_AT = 3;
const BONUS_PTS_AT = 10;

/**
 * Affiliate-only rewards progress. `referralCount` from SliceWP (when linked) or `orders.referred_by_user_id`.
 */
export function AffiliateRewardsSection({ referralCount }: { referralCount: number }) {
  const pct3 = Math.min(100, (Math.min(referralCount, FREE_PRODUCT_AT) / FREE_PRODUCT_AT) * 100);
  const pct10 = Math.min(100, (Math.min(referralCount, BONUS_PTS_AT) / BONUS_PTS_AT) * 100);
  const unlocked3 = referralCount >= FREE_PRODUCT_AT;
  const unlocked10 = referralCount >= BONUS_PTS_AT;

  return (
    <Section title="Affiliate rewards">
      <p className="text-sm text-zinc-500 -mt-2 mb-4">
        For affiliates — progress uses your referral orders (store sync or SliceWP when connected).
      </p>
      <div className="space-y-4">
        <Card className="border-sky-500/20 bg-sky-950/15">
          <CardContent className="p-4 md:p-5">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300">
                <Gift className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Milestone</p>
                <p className="font-semibold text-zinc-100 mt-0.5">Free product after first 3 referral orders</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Automatic when you reach 3 qualifying referral orders — fulfillment per program terms.
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] uppercase tracking-wide text-zinc-500">
                    <span>Progress</span>
                    <span className="tabular-nums text-zinc-400">
                      {Math.min(referralCount, FREE_PRODUCT_AT)} / {FREE_PRODUCT_AT}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        unlocked3 ? "bg-sky-500" : "bg-sky-600/70"
                      )}
                      style={{ width: `${pct3}%` }}
                    />
                  </div>
                  {unlocked3 && (
                    <p className="text-xs font-medium text-sky-400/95">Eligible — reward applied per program rules</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-700/80 bg-zinc-900/40">
          <CardContent className="p-4 md:p-5">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-800/80 text-zinc-400">
                <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">How it works</p>
                <p className="font-semibold text-zinc-100 mt-0.5">50 pts per referral order</p>
                <p className="text-xs text-zinc-500 mt-1 leading-snug">
                  Informational — points are credited when qualifying referral orders are recorded in your rewards
                  ledger (same rules as other earn events).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20 bg-violet-950/15">
          <CardContent className="p-4 md:p-5">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
                <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bonus</p>
                <p className="font-semibold text-zinc-100 mt-0.5">200 pts after 10 total referral orders</p>
                <p className="text-xs text-zinc-500 mt-1">One-time bonus when your 10th qualifying referral order is recorded.</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] uppercase tracking-wide text-zinc-500">
                    <span>Progress</span>
                    <span className="tabular-nums text-zinc-400">
                      {Math.min(referralCount, BONUS_PTS_AT)} / {BONUS_PTS_AT}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        unlocked10 ? "bg-violet-500" : "bg-violet-600/70"
                      )}
                      style={{ width: `${pct10}%` }}
                    />
                  </div>
                  {unlocked10 && (
                    <p className="text-xs font-medium text-violet-400/95">Eligible — bonus credited per program rules</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
