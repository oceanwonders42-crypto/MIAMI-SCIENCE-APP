"use client";

import { useEffect, useState } from "react";

const MOTIVATIONAL_LINES = [
  "Own every rep.",
  "Stronger than yesterday.",
  "Build the habit. Earn the edge.",
  "Your session starts now.",
  "Consistency beats intensity.",
  "Train like it matters — because it does.",
  "Progress is earned, not given.",
  "Show up. Lock in. Level up.",
];

function partOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function pickMotivation(displayName: string): string {
  const seed = displayName.length + dayOfYear();
  return MOTIVATIONAL_LINES[seed % MOTIVATIONAL_LINES.length]!;
}

/**
 * Time-dependent salutation — deferred until after mount (SSR matches first client paint).
 */
export function DashboardHeroSalutation() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const greeting = mounted ? partOfDay() : "Welcome";
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300/90 drop-shadow-sm">
      {greeting}
    </p>
  );
}

/** Tagline under the user name — same hydration strategy as salutation. */
export function DashboardHeroTagline({ displayName }: { displayName: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tagline = mounted
    ? pickMotivation(displayName)
    : MOTIVATIONAL_LINES[displayName.length % MOTIVATIONAL_LINES.length]!;
  return (
    <p className="mt-3 max-w-lg text-base sm:text-lg font-semibold text-zinc-200/95 leading-snug">
      {tagline}
    </p>
  );
}
