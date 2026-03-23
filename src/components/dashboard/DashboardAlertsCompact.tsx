import Link from "next/link";
import type { AttentionItem } from "@/lib/attention-items";

/** Only renders when there is something actionable — keeps the dashboard calm. */
export function DashboardAlertsCompact({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  const shown = items.slice(0, 3);
  const more = items.length - shown.length;

  return (
    <section aria-label="Reminders" className="space-y-2">
      <p className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Needs you
      </p>
      <ul className="space-y-2">
        {shown.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] px-3.5 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-200 text-xs font-bold">
              !
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100 leading-snug">{item.title}</p>
              <p className="text-xs text-zinc-500 line-clamp-2">{item.message}</p>
            </div>
            {item.ctaUrl.startsWith("http") ? (
              <a
                href={item.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-white transition-colors"
              >
                {item.ctaLabel}
              </a>
            ) : (
              <Link
                href={item.ctaUrl}
                className="shrink-0 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-white transition-colors"
              >
                {item.ctaLabel}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="text-center text-xs text-zinc-500">+{more} more in your stack & orders</p>
      )}
    </section>
  );
}
