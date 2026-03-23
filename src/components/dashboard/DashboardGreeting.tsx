function partOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Minimal dashboard header — mobile-first, no heavy chrome. */
export function DashboardGreeting({ displayName }: { displayName: string }) {
  return (
    <header className="px-4 pt-5 pb-2 md:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
        {partOfDay()}
      </p>
      <h1 className="mt-1.5 text-[1.65rem] sm:text-[1.85rem] font-semibold tracking-tight text-zinc-50">
        {displayName}
      </h1>
    </header>
  );
}
