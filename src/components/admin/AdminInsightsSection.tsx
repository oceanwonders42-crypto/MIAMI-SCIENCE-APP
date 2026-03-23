import type { AdminDashboardStats } from "@/lib/admin/dashboard-stats";

function formatUsd(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

export function AdminInsightsSection({ stats }: { stats: AdminDashboardStats }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Top affiliates (commission)</h3>
        {stats.topAffiliates.length === 0 ? (
          <p className="text-sm text-zinc-500">No SliceWP stats cache yet — affiliates sync in-app.</p>
        ) : (
          <ol className="space-y-2">
            {stats.topAffiliates.map((a, i) => (
              <li key={a.userId} className="flex justify-between gap-2 text-sm">
                <span className="text-zinc-600 dark:text-zinc-300">
                  <span className="text-zinc-400 mr-1">{i + 1}.</span>
                  {a.displayName ?? a.referralCode ?? a.userId.slice(0, 8)}
                </span>
                <span className="tabular-nums text-zinc-900 dark:text-zinc-100">{formatUsd(a.commissionCents)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Popular products (order lines)</h3>
        {stats.popularProducts.length === 0 ? (
          <p className="text-sm text-zinc-500">No line items in recent orders metadata.</p>
        ) : (
          <ol className="space-y-2">
            {stats.popularProducts.map((p, i) => (
              <li key={p.name} className="flex justify-between gap-2 text-sm">
                <span className="text-zinc-600 dark:text-zinc-300 truncate">
                  <span className="text-zinc-400 mr-1">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="tabular-nums text-zinc-900 dark:text-zinc-100 shrink-0">{p.units} units</span>
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs text-zinc-500 mt-3">Sampled from recent orders with line_items in metadata.</p>
      </div>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">User retention (signups)</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">This calendar week</dt>
            <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{stats.signupsThisWeek}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Last calendar week</dt>
            <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{stats.signupsLastWeek}</dd>
          </div>
        </dl>
        <p className="text-xs text-zinc-500 mt-3">Based on <code className="text-[10px]">profiles.created_at</code> (UTC week, Mon–Sun).</p>
      </div>
    </div>
  );
}
