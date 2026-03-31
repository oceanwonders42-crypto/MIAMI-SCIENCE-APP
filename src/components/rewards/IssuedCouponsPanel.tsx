import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { RewardRedemption } from "@/types";

function statusLabel(s: RewardRedemption["status"]): string {
  switch (s) {
    case "issued":
      return "Ready to use";
    case "used":
      return "Used at checkout";
    case "invalidated":
      return "Void";
    default:
      return s;
  }
}

export function IssuedCouponsPanel({ rows }: { rows: RewardRedemption[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-2">
        Redeem a reward above to get a one-time coupon code for checkout.
      </p>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950/40">
      <CardHeader>
        <CardTitle className="text-base">Your coupon codes</CardTitle>
        <p className="text-sm text-zinc-500">
          One-time codes for mia-science.com checkout. Each code works once; after use it is removed
          automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-mono font-semibold text-zinc-100 tracking-wide">{r.coupon_code}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{statusLabel(r.status)}</p>
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
