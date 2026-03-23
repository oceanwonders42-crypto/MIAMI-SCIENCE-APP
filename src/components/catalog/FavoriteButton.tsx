"use client";

import { useState } from "react";
import { addFavoriteAction, removeFavoriteAction } from "@/app/(dashboard)/catalog/actions";

interface FavoriteButtonProps {
  productId: string;
  isFavorite: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function FavoriteButton({ productId, isFavorite: initial, size = "md", className }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    const result = isFavorite
      ? await removeFavoriteAction(productId)
      : await addFavoriteAction(productId);
    setLoading(false);
    if (result.ok) setIsFavorite(!isFavorite);
  }

  const sizeClass = size === "sm" ? "p-1.5" : "p-2";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={`rounded-full border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50 ${sizeClass} ${className ?? ""}`}
    >
      {isFavorite ? (
        <span className="text-amber-500" aria-hidden>♥</span>
      ) : (
        <span className="text-zinc-400 dark:text-zinc-500" aria-hidden>♡</span>
      )}
    </button>
  );
}
