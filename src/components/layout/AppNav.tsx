"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { ROUTES } from "@/lib/constants";
import { isAffiliateOrAdmin } from "@/lib/auth";
import { AFFILIATE_ROOM_SLUG } from "@/lib/affiliate-chat";

const COMMUNITY_AFFILIATE_HREF = `${ROUTES.community}?room=${encodeURIComponent(AFFILIATE_ROOM_SLUG)}`;

const MAIN_NAV: { href: string; label: string; roles?: UserRole[] }[] = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.training, label: "Training" },
  { href: ROUTES.progress, label: "Progress" },
  { href: ROUTES.calories, label: "Calories" },
  { href: ROUTES.stack, label: "Stack" },
  { href: ROUTES.catalog, label: "Catalog" },
  { href: ROUTES.orders, label: "Orders" },
  { href: ROUTES.rewards, label: "Rewards" },
  { href: ROUTES.affiliate, label: "Affiliate" },
  /** Same destination as bottom “Chat” and Explore — avoids wrong default room and fixes active state. */
  { href: COMMUNITY_AFFILIATE_HREF, label: "Community", roles: ["affiliate", "admin"] },
  { href: ROUTES.help, label: "Help" },
  { href: ROUTES.admin, label: "Admin", roles: ["admin"] },
  { href: ROUTES.account, label: "Account" },
];

function getNavItems(role: UserRole) {
  return MAIN_NAV.filter((item) => !item.roles || item.roles.includes(role));
}

interface AppNavProps {
  role: UserRole;
  variant?: "bottom" | "sidebar";
  /** Unread team-chat messages (affiliate room). */
  affiliateChatUnread?: number;
}

export function AppNav({
  role,
  variant = "bottom",
  affiliateChatUnread = 0,
}: AppNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const items = getNavItems(role);

  if (variant === "sidebar") {
    return (
      <nav className="flex flex-col gap-1 p-2" aria-label="Main navigation">
        {items.map((item) => {
          const isAffiliateCommunity =
            item.href.startsWith(ROUTES.community) &&
            item.href.includes(`room=${AFFILIATE_ROOM_SLUG}`);
          const isActive = isAffiliateCommunity
            ? pathname.startsWith(ROUTES.community) &&
              searchParams.get("room") === AFFILIATE_ROOM_SLUG
            : pathname === item.href ||
              (item.href.split("?")[0] &&
                pathname.startsWith(`${item.href.split("?")[0]}/`));
          const isCommunity = isAffiliateCommunity || item.href === ROUTES.community;
          const showUnread =
            isCommunity &&
            isAffiliateOrAdmin(role) &&
            affiliateChatUnread > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-500/15 text-primary-400"
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {item.label}
                {showUnread && (
                  <span
                    className="inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-sm"
                    aria-label={`${affiliateChatUnread} unread messages`}
                  >
                    {affiliateChatUnread > 99 ? "99+" : affiliateChatUnread}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Bottom nav: Home, Training, Calories, Orders (+ Chat for affiliates), Account
  const bottomItems: { href: string; label: string }[] = [
    { href: ROUTES.dashboard, label: "Home" },
    { href: ROUTES.training, label: "Training" },
    { href: ROUTES.calories, label: "Calories" },
    { href: ROUTES.orders, label: "Orders" },
  ];
  if (isAffiliateOrAdmin(role)) {
    bottomItems.push({
      href: COMMUNITY_AFFILIATE_HREF,
      label: "Chat",
    });
  }
  if (role === "admin") {
    bottomItems.push({ href: ROUTES.admin, label: "Admin" });
  }
  bottomItems.push({ href: ROUTES.account, label: "Account" });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-zinc-800 bg-zinc-900/95 backdrop-blur safe-bottom"
      aria-label="Bottom navigation"
    >
      {bottomItems.map((item) => {
        const isChat =
          item.href.startsWith(ROUTES.community) &&
          item.href.includes(`room=${AFFILIATE_ROOM_SLUG}`);
        const isActive = isChat
          ? pathname.startsWith(ROUTES.community) &&
            searchParams.get("room") === AFFILIATE_ROOM_SLUG
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const showUnread =
          isChat && isAffiliateOrAdmin(role) && affiliateChatUnread > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center flex-1 py-2.5 text-xs font-medium transition-colors min-w-0",
              isActive ? "text-primary-400" : "text-zinc-500"
            )}
          >
            <span className="truncate flex items-center gap-1">
              {item.label}
              {showUnread && (
                <span
                  className="inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-[9px] font-bold text-white"
                  aria-label={`${affiliateChatUnread} unread`}
                >
                  {affiliateChatUnread > 9 ? "9+" : affiliateChatUnread}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
