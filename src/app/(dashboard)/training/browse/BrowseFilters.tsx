"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BrowseFiltersProps {
  categories: string[];
  muscleGroups: string[];
  activeCategory: string | null;
  activeMuscle: string | null;
  searchQuery?: string | null;
}

function qs(category: string | null, muscle: string | null, searchQuery?: string | null): string {
  const p = new URLSearchParams();
  if (searchQuery) p.set("q", searchQuery);
  if (category) p.set("category", category);
  if (muscle) p.set("muscle", muscle);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function BrowseFilters({
  categories,
  muscleGroups,
  activeCategory,
  activeMuscle,
  searchQuery = null,
}: BrowseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.length > 0 && (
        <>
          <Link
            href={ROUTES.trainingBrowse + qs(null, null, searchQuery)}
            className={cn(
              "rounded-full px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation active:scale-[0.98]",
              !activeCategory && !activeMuscle
                ? "bg-primary-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={ROUTES.trainingBrowse + qs(c, activeMuscle, searchQuery)}
              className={cn(
                "rounded-full px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation active:scale-[0.98]",
                activeCategory === c
                  ? "bg-primary-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              )}
            >
              {c}
            </Link>
          ))}
        </>
      )}
      {muscleGroups.length > 0 && (
        <>
          <Link
            href={ROUTES.trainingBrowse + qs(activeCategory, null, searchQuery)}
            className={cn(
              "rounded-full px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation active:scale-[0.98]",
              !activeMuscle
                ? "bg-zinc-700 text-zinc-100"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            )}
          >
            Muscles
          </Link>
          {muscleGroups.map((m) => (
            <Link
              key={m}
              href={ROUTES.trainingBrowse + qs(activeCategory, m, searchQuery)}
              className={cn(
                "rounded-full px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation active:scale-[0.98]",
                activeMuscle === m
                  ? "bg-primary-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              )}
            >
              {m}
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
