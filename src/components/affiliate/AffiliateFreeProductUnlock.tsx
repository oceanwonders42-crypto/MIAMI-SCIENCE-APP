import { Card, CardContent } from "@/components/ui/Card";
import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const TARGET = 3;

/** Progress toward first free product (referral order count from SliceWP or `orders.referred_by_user_id`). */
export function AffiliateFreeProductUnlock({ referralCount }: { referralCount: number }) {
  const n = Math.max(0, referralCount);
  const pct = Math.min(100, (Math.min(n, TARGET) / TARGET) * 100);
  const unlocked = n >= TARGET;

  return (
    <Card
      className={cn(
        "border overflow-hidden",
        unlocked
          ? "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)]"
          : "border-violet-500/25 bg-gradient-to-br from-violet-950/20 to-zinc-950"
      )}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
              unlocked
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-violet-500/35 bg-violet-500/10 text-violet-300"
            )}
          >
            <Gift className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Milestone</p>
            <h2 className="mt-1 text-lg font-bold text-zinc-50">Free product unlock</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Earn a free product after your first {TARGET} qualifying referral orders (automatic when
              eligible).
            </p>
            {!unlocked && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[11px] uppercase tracking-wide text-zinc-500">
                  <span>Progress</span>
                  <span className="tabular-nums text-zinc-400">
                    {Math.min(n, TARGET)} / {TARGET}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
            {unlocked && (
              <p className="mt-4 text-sm font-medium text-emerald-300/95 leading-relaxed">
                🎉 You&apos;ve unlocked a free product! Contact Miami Science to claim.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
