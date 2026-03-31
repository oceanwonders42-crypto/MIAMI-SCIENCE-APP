"use client";

import { useState, useTransition } from "react";
import { syncAffiliateExternalNowAction } from "@/app/(dashboard)/affiliate/actions";
import { cn } from "@/lib/utils";

export function AffiliateSyncNowButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        disabled={pending}
        data-testid="affiliate-sync-now"
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const r = await syncAffiliateExternalNowAction();
            if (!r.ok) setMsg(r.error);
          });
        }}
        className="inline-flex items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/15 disabled:opacity-50"
      >
        {pending ? "Syncing…" : "Sync promo & affiliate data"}
      </button>
      {msg ? <p className="text-xs text-red-400 max-w-md">{msg}</p> : null}
    </div>
  );
}
