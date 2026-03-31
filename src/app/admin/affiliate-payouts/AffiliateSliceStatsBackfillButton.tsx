"use client";

import { useState } from "react";
import { runAffiliateSliceStatsBackfillAdminAction } from "./actions";

export function AffiliateSliceStatsBackfillButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setMessage(null);
          const r = await runAffiliateSliceStatsBackfillAdminAction();
          setPending(false);
          if (r.ok) {
            setMessage(
              `Updated ${r.profilesProcessed} profile(s). Skipped (no Slice id): ${r.profilesSkippedNoSliceId}.`
            );
          } else {
            setMessage(r.error);
          }
        }}
        className="rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2 px-4 text-sm"
      >
        {pending ? "Running…" : "Rebuild stats cache from SliceWP"}
      </button>
      {message ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      ) : null}
    </div>
  );
}
