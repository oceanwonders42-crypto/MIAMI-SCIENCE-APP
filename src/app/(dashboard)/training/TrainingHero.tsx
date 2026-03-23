"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutAction } from "./actions";
import { ROUTES } from "@/lib/constants";

export function TrainingHero() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartWorkout() {
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
    router.push(ROUTES.trainingWorkout(result.id));
  }

  return (
    <section className="relative rounded-[1.25rem] overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/15 min-h-[200px] flex flex-col justify-end p-6">
      <div className="absolute inset-0 bg-zinc-900">
        <img
          src="/hero-training.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-zinc-900/60 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,80,200,0.12),transparent)]" />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Today&apos;s workout</h2>
          {error && (
            <p className="text-sm text-red-400 mt-1">{error}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleStartWorkout}
          disabled={loading}
          className="w-full sm:w-auto min-w-[220px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-5 px-8 text-lg shadow-lg shadow-emerald-500/25 disabled:opacity-60 transition-all active:scale-[0.98] touch-manipulation"
        >
          {loading ? "Starting…" : "Start workout"}
        </button>
      </div>
    </section>
  );
}
