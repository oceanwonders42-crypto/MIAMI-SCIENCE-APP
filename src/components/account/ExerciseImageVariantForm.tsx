"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { updateExerciseImageVariantAction } from "@/app/(dashboard)/account/actions";
import type { ExerciseImageVariant } from "@/types";

interface ExerciseImageVariantFormProps {
  currentVariant: ExerciseImageVariant;
}

export function ExerciseImageVariantForm({ currentVariant }: ExerciseImageVariantFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSelect(variant: ExerciseImageVariant) {
    if (variant === currentVariant) return;
    setError(null);
    setSuccess(false);
    setLoading(true);
    const result = await updateExerciseImageVariantAction(variant);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
          Choose which exercise image set to show in the training library and exercise details.
        </p>
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3 mb-3">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3 mb-3">
            Saved. Training pages will use your selection.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSelect("men")}
            disabled={loading}
            className={`rounded-xl px-4 py-3 text-sm font-medium min-h-[48px] touch-manipulation transition-colors disabled:opacity-50 ${
              currentVariant === "men"
                ? "bg-primary-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
            }`}
          >
            Men&apos;s set
          </button>
          <button
            type="button"
            onClick={() => handleSelect("women")}
            disabled={loading}
            className={`rounded-xl px-4 py-3 text-sm font-medium min-h-[48px] touch-manipulation transition-colors disabled:opacity-50 ${
              currentVariant === "women"
                ? "bg-primary-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
            }`}
          >
            Women&apos;s set
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
