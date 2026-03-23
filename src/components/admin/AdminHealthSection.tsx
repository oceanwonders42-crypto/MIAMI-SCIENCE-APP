import type { IntegrationHealthRow } from "@/lib/admin/dashboard-stats";

function StatusDot({ status }: { status: IntegrationHealthRow["status"] }) {
  const cls =
    status === "green"
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
      : status === "amber"
        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} title={status} />;
}

export function AdminHealthSection({ rows }: { rows: IntegrationHealthRow[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/50 px-4 py-3"
        >
          <StatusDot status={row.status} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{row.label}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.detail}</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              {row.lastRunAt
                ? `Last: ${new Date(row.lastRunAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}`
                : "No run recorded yet"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
