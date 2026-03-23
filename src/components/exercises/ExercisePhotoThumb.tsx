"use client";

import { useState } from "react";
import { isValidImageUrl } from "@/lib/exercises";
import { ExerciseIllustration } from "@/components/exercises/illustrations/ExerciseIllustration";
import { cn } from "@/lib/utils";

interface ExercisePhotoThumbProps {
  slug: string;
  imageUrl: string | null;
  category?: string | null;
  className?: string;
}

/**
 * Small exercise photo with SVG fallback (matches ExerciseCard / ExerciseImage behavior).
 */
export function ExercisePhotoThumb({ slug, imageUrl, category, className }: ExercisePhotoThumbProps) {
  const [failed, setFailed] = useState(false);
  const showImg = isValidImageUrl(imageUrl) && !failed;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl bg-zinc-800/90 ring-1 ring-white/[0.06]",
        className
      )}
    >
      {showImg ? (
        <img
          src={imageUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ExerciseIllustration slug={slug} variant="card" category={category} className="h-full w-full" />
      )}
    </div>
  );
}
