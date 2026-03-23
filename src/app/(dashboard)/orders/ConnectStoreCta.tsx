"use client";

import { useState, useTransition } from "react";
import { retryStoreAutoLinkAction } from "./actions";

export function ConnectStoreCta() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onConnect() {
    setMessage(null);
    startTransition(async () => {
      const r = await retryStoreAutoLinkAction();
      setMessage(r.message);
    });
  }

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 space-y-2">
      <p className="text-sm text-zinc-200">
        <span className="font-semibold text-amber-100/95">Connect your store account</span> — We
        couldn’t match your app login to mia-science.com orders yet. Use the same email as checkout,
        then link to pull in your order history.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onConnect}
          disabled={pending}
          className="rounded-lg bg-amber-500/90 hover:bg-amber-400 text-zinc-950 font-semibold py-2 px-4 text-sm disabled:opacity-60"
        >
          {pending ? "Connecting…" : "Connect store account"}
        </button>
        {message && (
          <p className="text-sm text-zinc-400 max-w-prose" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
