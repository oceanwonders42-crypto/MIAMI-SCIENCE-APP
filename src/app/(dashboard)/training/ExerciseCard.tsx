"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { isValidImageUrl } from "@/lib/exercises";
import { ExerciseIllustration } from "@/components/exercises/illustrations/ExerciseIllustration";
import { cn } from "@/lib/utils";

interface ExerciseCardProps {
  name: string;
  slug: string;
  imageUrl?: string | null;
  category?: string | null;
  muscleGroup?: string | null;
  lastStat?: string | null;
  prStat?: string | null;
  /** When true, adds subtle featured styling (ring + shadow). */
  featured?: boolean;
  className?: string;
}

export function ExerciseCard({
  name,
  slug,
  imageUrl,
  category,
  muscleGroup,
  lastStat,
  prStat,
  featured,
  className,
}: ExerciseCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = isValidImageUrl(imageUrl) && !imageFailed;
  const href = ROUTES.trainingExercise(slug);
  const sub = [category, muscleGroup].filter(Boolean).join(" · ") || null;

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl overflow-hidden bg-zinc-900/80",
        "shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-200 active:scale-[0.98] touch-manipulation",
        featured
          ? "border border-primary-500/25 shadow-primary-500/5 hover:border-primary-500/40 hover:shadow-primary-500/10"
          : "border border-zinc-800 hover:border-zinc-700 hover:shadow-primary-500/10",
        className
      )}
    >
      <div className="aspect-[3/4] relative bg-gradient-to-br from-zinc-800 via-zinc-800/95 to-primary-950/20">
        {showImage ? (
          <img
            src={imageUrl!}
            alt=""
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
          />
        ) : (
          <ExerciseIllustration
            slug={slug}
            variant="card"
            category={category}
            className="absolute inset-0"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-1.5">
          {prStat && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white">
              PR {prStat}
            </span>
          )}
          {lastStat && !prStat && (
            <span className="text-xs text-zinc-300/90 font-medium">{lastStat}</span>
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-zinc-100 line-clamp-2 group-hover:text-primary-400 transition-colors text-sm leading-tight">
          {name}
        </h3>
        {sub && (
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{sub}</p>
        )}
      </div>
    </Link>
  );
}
