import { Coins, Flame, Star, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

const ROWS = [
  {
    icon: Coins,
    title: "Purchase",
    detail: "10 pts per $1",
    sub: "On qualifying orders at mia-science.com",
    className: "text-amber-300/95",
    bg: "bg-amber-500/15 border-amber-500/25",
  },
  {
    icon: Flame,
    title: "Check-in streak",
    detail: "1 pt / day",
    sub: "Keep your daily check-in streak going",
    className: "text-orange-300/95",
    bg: "bg-orange-500/15 border-orange-500/25",
  },
  {
    icon: UserPlus,
    title: "Referral",
    detail: "100 pts",
    sub: "When a referred friend completes a qualifying purchase",
    className: "text-sky-300/95",
    bg: "bg-sky-500/15 border-sky-500/25",
  },
  {
    icon: Star,
    title: "Review",
    detail: "25 pts",
    sub: "Verified product review (where available)",
    className: "text-violet-300/95",
    bg: "bg-violet-500/15 border-violet-500/25",
  },
] as const;

export function HowToEarnSection() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ROWS.map((row) => (
        <Card
          key={row.title}
          className={`border ${row.bg} overflow-hidden`}
        >
          <CardContent className="p-4 flex gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-950/60 ${row.className}`}
              aria-hidden
            >
              <row.icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {row.title}
              </p>
              <p className="text-lg font-bold text-zinc-100 tabular-nums mt-0.5">{row.detail}</p>
              <p className="text-xs text-zinc-500 mt-1 leading-snug">{row.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
