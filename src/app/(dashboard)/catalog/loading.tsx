import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";

export default function CatalogLoading() {
  return (
    <div className="min-h-full bg-zinc-950 pb-28 md:pb-10">
      <Header
        title="Shop"
        subtitle="Mia Science — premium formulas"
        className="border-b border-white/[0.06]"
        action={
          <Link
            href={ROUTES.cart}
            className="rounded-2xl border border-white/[0.1] bg-zinc-900/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500"
          >
            Cart
          </Link>
        }
      />
      <div className="px-4 md:px-8 max-w-6xl mx-auto space-y-8 pt-6 pb-10">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 shrink-0 rounded-full bg-zinc-800/70 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-white/[0.06] bg-zinc-900/40 animate-pulse"
            >
              <div className="aspect-square bg-zinc-800/50" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-zinc-800/60 rounded" />
                <div className="h-3 w-1/2 bg-zinc-800/40 rounded" />
                <div className="h-10 w-full bg-zinc-800/50 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
