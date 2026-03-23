"use client";

import {
  EXERCISE_ILLUSTRATION_BY_SLUG,
  DefaultExerciseIllustration,
} from "./exercise-illustrations";
import { cn } from "@/lib/utils";

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** Visual theme per library category (Strength / Cardio / Mobility). */
function categoryTheme(category: string | null | undefined): string {
  const c = category?.trim().toLowerCase() ?? "";
  if (c === "strength") {
    return "from-emerald-950/90 via-zinc-900 to-zinc-950 text-emerald-300";
  }
  if (c === "cardio") {
    return "from-sky-950/90 via-zinc-900 to-zinc-950 text-sky-300";
  }
  if (c === "mobility") {
    return "from-violet-950/90 via-zinc-900 to-zinc-950 text-violet-300";
  }
  return "from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-200";
}

/**
 * Renders the unique line-art SVG for a library exercise slug.
 * Use when `image_url` is missing or failed to load.
 */
export function ExerciseIllustration({
  slug,
  className,
  variant = "card",
  category,
}: {
  slug: string;
  className?: string;
  /** Larger padding + max width on exercise detail hero */
  variant?: "card" | "detail";
  /** Drives gradient + stroke accent: Strength = emerald, Cardio = blue, Mobility = purple */
  category?: string | null;
}) {
  const key = normalizeSlug(slug);
  const Comp = EXERCISE_ILLUSTRATION_BY_SLUG[key] ?? DefaultExerciseIllustration;

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br",
        categoryTheme(category),
        variant === "detail" ? "p-6 sm:p-10" : "p-2 sm:p-4",
        className
      )}
    >
      {/* Subtle texture so the panel never reads as a flat black square */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] bg-[length:14px_14px]"
        aria-hidden
      />
      <Comp
        className={cn(
          "relative z-[1] h-full w-full max-h-full drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]",
          variant === "detail" ? "max-w-[min(100%,300px)]" : "max-w-[min(92%,240px)]"
        )}
      />
    </div>
  );
}
