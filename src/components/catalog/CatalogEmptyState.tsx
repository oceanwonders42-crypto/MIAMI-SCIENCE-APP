"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { runCatalogProductSyncAction } from "@/app/(dashboard)/catalog/actions";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";

export function CatalogEmptyState({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setError(null);
    setHint(null);
    const out = await runCatalogProductSyncAction();
    setLoading(false);
    if (!out.ok) {
      setError(out.error);
      return;
    }
    setHint(
      `Synced ${out.result.fetched} from WooCommerce (${out.result.productsInserted} new, ${out.result.productsUpdated} updated).`
    );
    router.refresh();
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 sm:p-12 text-center shadow-2xl shadow-black/40">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl"
        aria-hidden
      />
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-400/90">Mia Science store</p>
      <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">Catalog is empty</h2>
      <p className="mt-3 max-w-md mx-auto text-sm text-zinc-400 leading-relaxed">
        Products load from your WooCommerce catalog after an admin runs <strong className="text-zinc-300">Product sync</strong>.
        You can always shop on the site while we connect inventory.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={SHOP_REFILL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-primary-400 px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-primary-900/25 hover:bg-primary-300 transition-colors"
        >
          Shop mia-science.com
        </a>
        {isAdmin ? (
          <button
            type="button"
            onClick={sync}
            disabled={loading}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-white/[0.12] bg-zinc-900/60 px-8 py-3.5 text-sm font-bold text-zinc-100 backdrop-blur-sm hover:border-primary-500/30 hover:bg-zinc-900 transition-colors disabled:opacity-50"
          >
            {loading ? "Syncing…" : "Run product sync"}
          </button>
        ) : (
          <Link
            href={ROUTES.dashboard}
            className="text-sm font-semibold text-zinc-500 hover:text-primary-300 transition-colors"
          >
            ← Back to dashboard
          </Link>
        )}
      </div>
      {!isAdmin && (
        <p className="mt-6 text-xs text-zinc-600 max-w-sm mx-auto">
          Ask your team admin to open <span className="text-zinc-500">Admin → Product sync</span> if products should appear here.
        </p>
      )}
      {error && (
        <p className="mt-6 text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-3 max-w-lg mx-auto">
          {error}
        </p>
      )}
      {hint && (
        <p className="mt-6 text-sm text-emerald-400/90 bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-4 py-3 max-w-lg mx-auto">
          {hint}
        </p>
      )}
    </div>
  );
}
