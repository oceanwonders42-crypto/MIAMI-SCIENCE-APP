import Link from "next/link";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";
import { AFFILIATE_ROOM_SLUG } from "@/lib/affiliate-chat";
import type { Announcement } from "@/types";

type ExploreItem = {
  href: string;
  label: string;
  sub?: string;
  external?: boolean;
};

export function DashboardExploreGrid({
  showAffiliateProgram,
  showAffiliateCommunity,
  announcements,
}: {
  /** Affiliate tab is visible to all logged-in users (locked or full dashboard). */
  showAffiliateProgram: boolean;
  /** Team chat room only for affiliates/admins who use the affiliate community. */
  showAffiliateCommunity: boolean;
  announcements: Announcement[];
}) {
  const items: ExploreItem[] = [
    { href: ROUTES.progress, label: "Progress", sub: "Weight & metrics" },
    { href: ROUTES.calories, label: "Calories", sub: "Meal log & estimates" },
    { href: ROUTES.stack, label: "Stack", sub: "Supplements" },
    { href: ROUTES.catalog, label: "Catalog", sub: "Products" },
    { href: ROUTES.orders, label: "Orders", sub: "History" },
  ];
  if (showAffiliateProgram) {
    items.push({ href: ROUTES.affiliate, label: "Affiliate", sub: "Program" });
  }
  if (showAffiliateCommunity) {
    items.push({
      href: `${ROUTES.community}?room=${encodeURIComponent(AFFILIATE_ROOM_SLUG)}`,
      label: "Community",
      sub: "Team chat",
    });
  }
  items.push(
    { href: ROUTES.account, label: "Account", sub: "Settings" },
    { href: ROUTES.help, label: "Help", sub: "Support" },
    { href: SHOP_REFILL_URL, label: "Shop", sub: "Reorder", external: true }
  );

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-400/85">
            Explore
          </p>
          <p className="mt-0.5 text-sm font-semibold text-zinc-300">
            Everything in one place
          </p>
        </div>
      </div>
      {announcements.length > 0 && (
        <div className="rounded-2xl border border-primary-500/15 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 px-4 py-3.5 shadow-lg shadow-black/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary-400/90">
            Announcement
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-100 line-clamp-2">{announcements[0].title}</p>
          {announcements[0].body?.trim() ? (
            <div
              className="mt-2 text-xs text-zinc-300/95 line-clamp-6 prose prose-invert prose-sm max-w-none [&_a]:text-primary-400 [&_p]:my-1"
              dangerouslySetInnerHTML={{ __html: announcements[0].body }}
            />
          ) : null}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {items.map((item) =>
          item.external ? (
            <a
              key={`ext-${item.label}`}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 px-3 py-3.5 transition-all hover:border-primary-500/25 hover:bg-zinc-900/70 active:scale-[0.99]"
            >
              <p className="text-sm font-medium text-zinc-100">{item.label}</p>
              {item.sub && <p className="text-xs text-zinc-500 mt-0.5">{item.sub}</p>}
            </a>
          ) : (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 px-3 py-3.5 transition-all hover:border-primary-500/25 hover:bg-zinc-900/70 active:scale-[0.99]"
            >
              <p className="text-sm font-medium text-zinc-100">{item.label}</p>
              {item.sub && <p className="text-xs text-zinc-500 mt-0.5">{item.sub}</p>}
            </Link>
          )
        )}
      </div>
    </section>
  );
}
