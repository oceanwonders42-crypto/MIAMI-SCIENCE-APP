import {
  Users,
  Activity,
  ShoppingBag,
  DollarSign,
  UserPlus,
  Coins,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { AdminDashboardStats } from "@/lib/admin/dashboard-stats";

function formatUsd(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

function TrendPill({
  current,
  previous,
  label,
}: {
  current: number;
  previous: number;
  label: string;
}) {
  if (previous <= 0 && current <= 0) {
    return <span className="text-xs text-zinc-500">No prior data</span>;
  }
  const delta = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const up = delta > 0;
  const flat = delta === 0;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
      {flat ? (
        <Minus className="w-3 h-3 text-zinc-500" />
      ) : up ? (
        <TrendingUp className="w-3 h-3 text-emerald-500" />
      ) : (
        <TrendingDown className="w-3 h-3 text-amber-500" />
      )}
      {label}: {flat ? "flat" : `${up ? "+" : ""}${delta}%`} vs prior period
    </span>
  );
}

export function AdminOverviewStats({ stats }: { stats: AdminDashboardStats }) {
  const cards = [
    {
      label: "Total users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      sub: <TrendPill current={stats.signupsThisWeek} previous={stats.signupsLastWeek} label="Signups" />,
    },
    {
      label: "Active this week",
      value: stats.activeUsersThisWeek.toLocaleString(),
      icon: Activity,
      sub: (
        <TrendPill
          current={stats.activeUsersThisWeek}
          previous={stats.activeUsersPrevWeek}
          label="Activity"
        />
      ),
    },
    {
      label: "Total orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      sub: <span className="text-xs text-zinc-500">All-time store orders</span>,
    },
    {
      label: "Total revenue",
      value: formatUsd(stats.totalRevenueCents),
      icon: DollarSign,
      sub: <span className="text-xs text-zinc-500">Sum of order totals</span>,
    },
    {
      label: "Affiliates",
      value: stats.totalAffiliates.toLocaleString(),
      icon: UserPlus,
      sub: <span className="text-xs text-zinc-500">Users with affiliate role</span>,
    },
    {
      label: "Points issued (lifetime)",
      value: Math.round(stats.totalPointsIssued).toLocaleString(),
      icon: Coins,
      sub: <span className="text-xs text-zinc-500">Sum of positive ledger entries</span>,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/40 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {c.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {c.value}
              </p>
              <div className="mt-2">{c.sub}</div>
            </div>
            <div className="rounded-lg bg-primary-500/10 p-2 text-primary-600 dark:text-primary-400">
              <c.icon className="w-5 h-5" aria-hidden />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
