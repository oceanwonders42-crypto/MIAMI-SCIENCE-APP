"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutAction } from "./actions";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AddToWorkoutButtonProps {
  exerciseName: string;
  /** "add" = primary "Add to workout"; "start" = secondary "Start with this" */
  variant?: "add" | "start";
}

const LABELS: Record<"add" | "start", { idle: string; loading: string }> = {
  add: { idle: "Add to workout", loading: "Starting…" },
  start: { idle: "Start with this", loading: "Starting…" },
};

export function AddToWorkoutButton({ exerciseName, variant = "add" }: AddToWorkoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labels = LABELS[variant];

  async function handleAddToNewWorkout() {
    setError(null);
    setLoading(true);
    const result = await createWorkoutAction({
      started_at: new Date().toISOString(),
      workout_type: "Strength",
      name: "Strength",
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const params = new URLSearchParams({ exercise: exerciseName });
    router.push(`${ROUTES.trainingWorkout(result.id)}?${params.toString()}`);
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-red-400 mb-2">{error}</p>
      )}
      <button
        type="button"
        onClick={handleAddToNewWorkout}
        disabled={loading}
        className={cn(
          "w-full rounded-2xl font-bold py-4 px-4 text-base disabled:opacity-60 transition-all active:scale-[0.98] touch-manipulation min-h-[52px]",
          variant === "add"
            ? "bg-primary-600 hover:bg-primary-500 text-white"
            : "border-2 border-primary-500/60 bg-primary-500/15 text-primary-300 hover:bg-primary-500/25"
        )}
      >
        {loading ? labels.loading : labels.idle}
      </button>
    </div>
  );
}
