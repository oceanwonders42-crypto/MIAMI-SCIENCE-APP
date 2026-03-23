"use client";

import { useRouter } from "next/navigation";

export function CommunityRefreshButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
    >
      Refresh
    </button>
  );
}
