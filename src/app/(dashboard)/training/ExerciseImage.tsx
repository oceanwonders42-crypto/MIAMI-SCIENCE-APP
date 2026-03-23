"use client";

import { useState } from "react";
import { isValidImageUrl } from "@/lib/exercises";
import { ExerciseIllustration } from "@/components/exercises/illustrations/ExerciseIllustration";
import { cn } from "@/lib/utils";

interface ExerciseImageProps {
  /** Image URL (only used if valid http(s)). */
  src?: string | null;
  /** Library slug — drives unique SVG when no photo. */
  slug: string;
  /** @deprecated Kept for call-site compatibility; illustrations replace letter fallback. */
  fallbackLetter?: string;
  className?: string;
  variant?: "card" | "detail";
  category?: string | null;
}

export function ExerciseImage({
  src,
  slug,
  className,
  variant = "card",
  category,
}: ExerciseImageProps) {
  const [failed, setFailed] = useState(false);
  const showImg = isValidImageUrl(src) && !failed;

  if (showImg) {
    return (
      <img
        src={src!}
        alt=""
        onError={() => setFailed(true)}
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          variant === "detail" ? "object-center" : "opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <ExerciseIllustration slug={slug} variant={variant} category={category} className="h-full w-full" />
    </div>
  );
}
