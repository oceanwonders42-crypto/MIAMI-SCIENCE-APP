"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AppNav } from "./AppNav";
import type { UserRole } from "@/types";
import { APP_NAME, ROUTES } from "@/lib/constants";

interface SidebarProps {
  role: UserRole;
  /** Unread count for affiliate team chat (Community). */
  affiliateChatUnread?: number;
}

export function Sidebar({ role, affiliateChatUnread = 0 }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:left-0 border-r border-zinc-800 bg-zinc-900/50">
      <div className="p-4 border-b border-zinc-800">
        <Link
          href={ROUTES.dashboard}
          className="text-lg font-semibold tracking-tight text-zinc-100"
        >
          {APP_NAME}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={null}>
          <AppNav
            role={role}
            variant="sidebar"
            affiliateChatUnread={affiliateChatUnread}
          />
        </Suspense>
      </div>
    </aside>
  );
}
