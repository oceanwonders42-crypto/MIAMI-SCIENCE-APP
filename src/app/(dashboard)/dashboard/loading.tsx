/** Premium dashboard shell — hero + content placeholders. */
export default function DashboardLoading() {
  return (
    <div className="min-h-full bg-zinc-950 pb-28 md:pb-10">
      <div className="relative min-h-[min(42vh,380px)] w-full overflow-hidden border-b border-white/[0.06] bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-zinc-800/40" />
        <div className="relative z-10 flex min-h-[inherit] flex-col justify-end px-4 pb-8 pt-14 md:px-8 max-w-5xl mx-auto w-full">
          <div className="h-3 w-32 bg-zinc-700/80 rounded animate-pulse" />
          <div className="mt-3 h-12 w-3/4 max-w-sm bg-zinc-700/70 rounded-lg animate-pulse" />
          <div className="mt-3 h-5 w-2/3 max-w-md bg-zinc-700/50 rounded animate-pulse" />
          <div className="mt-8 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl border border-white/[0.06] bg-zinc-800/40 animate-pulse"
              />
            ))}
          </div>
          <div className="mt-6 h-12 w-40 rounded-2xl bg-primary-500/30 animate-pulse" />
        </div>
      </div>

      <div className="px-4 md:px-8 max-w-5xl mx-auto space-y-7 pt-8 md:pt-10">
        <div className="h-72 rounded-3xl bg-zinc-900/60 border border-white/[0.06] animate-pulse" />
        <div className="h-28 rounded-2xl bg-zinc-900/50 border border-white/[0.05] animate-pulse" />
        <div className="h-36 rounded-2xl bg-zinc-900/50 border border-white/[0.05] animate-pulse" />
        <div className="h-24 rounded-2xl bg-zinc-900/40 border border-white/[0.05] animate-pulse" />
        <div className="h-40 rounded-2xl bg-zinc-900/40 border border-white/[0.05] animate-pulse" />
      </div>
    </div>
  );
}
