import Link from "next/link";
import { ExerciseCard } from "./ExerciseCard";
import { nameToSlug, getExerciseImageForUser } from "@/lib/exercises";
import { ROUTES } from "@/lib/constants";
import type { Exercise } from "@/types";
import type { ExerciseImageVariant } from "@/types";
import type { ExerciseHistoryItem, ExercisePR } from "@/lib/exercise-history";

interface ExerciseDiscoverySectionProps {
  history: ExerciseHistoryItem[];
  prs: ExercisePR[];
  exercisesByName: Map<string, Exercise>;
  exerciseImageVariant?: ExerciseImageVariant;
}

export function ExerciseDiscoverySection({
  history,
  prs,
  exercisesByName,
  exerciseImageVariant = "men",
}: ExerciseDiscoverySectionProps) {
  const prByExercise = new Map(
    prs.map((p) => [p.exerciseName.trim().toLowerCase(), p])
  );

  if (history.length === 0) {
    return (
      <section>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Your exercises</h3>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm text-zinc-500 mb-3">Log exercises in a workout to see them here.</p>
          <Link
            href={ROUTES.trainingBrowse}
            className="inline-flex items-center justify-center rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3.5 px-5 text-sm min-h-[48px] touch-manipulation active:scale-[0.98]"
          >
            Browse library
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Your exercises</h3>
      <div className="grid grid-cols-2 gap-4">
        {history.map((item) => {
          const nameKey = item.exerciseName.trim().toLowerCase();
          const exercise = exercisesByName.get(nameKey);
          const slug = exercise?.slug ?? nameToSlug(item.exerciseName);
          const pr = prByExercise.get(nameKey);
          const lastStat = [
            item.sets != null && `${item.sets}×`,
            item.reps != null && item.reps,
            item.weight != null && `${item.weight} kg`,
          ]
            .filter(Boolean)
            .join(" ") || null;
          return (
            <ExerciseCard
              key={`${item.exerciseName}-${item.lastLoggedAt}`}
              name={item.exerciseName}
              slug={slug}
              imageUrl={getExerciseImageForUser(
                { slug, image_url: exercise?.image_url ?? null },
                exerciseImageVariant
              )}
              category={exercise?.category ?? null}
              muscleGroup={exercise?.muscle_group ?? null}
              lastStat={lastStat || undefined}
              prStat={pr ? `${pr.maxWeight} kg` : undefined}
              featured={exercise?.display_order != null}
            />
          );
        })}
      </div>
    </section>
  );
}
