import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { ExerciseCard } from "./ExerciseCard";
import { getExerciseImageForUser } from "@/lib/exercises";
import type { Exercise } from "@/types";
import type { ExerciseImageVariant } from "@/types";

interface ExerciseLibrarySectionProps {
  /** First N exercises (e.g. featured/preview). */
  exercises: Exercise[];
  /** Total library size for "All N exercises" link. */
  totalCount?: number;
  /** User's preferred exercise image set. */
  exerciseImageVariant?: ExerciseImageVariant;
}

export function ExerciseLibrarySection({ exercises, totalCount, exerciseImageVariant = "men" }: ExerciseLibrarySectionProps) {
  const preview = exercises.slice(0, 6);
  const total = totalCount ?? exercises.length;

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Library</h3>
          <p className="text-[11px] text-zinc-600 mt-0.5">Featured moves</p>
        </div>
        <Link
          href={ROUTES.trainingBrowse}
          className="text-sm font-semibold text-primary-400 hover:text-primary-300 active:opacity-80 touch-manipulation"
        >
          Browse all
        </Link>
      </div>
      {preview.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm text-zinc-500">No exercises yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {preview.map((ex) => (
              <ExerciseCard
                key={ex.id}
                name={ex.name}
                slug={ex.slug}
                imageUrl={getExerciseImageForUser({ slug: ex.slug, image_url: ex.image_url }, exerciseImageVariant)}
                category={ex.category}
                muscleGroup={ex.muscle_group}
                featured={ex.display_order != null}
              />
            ))}
          </div>
          {total > 6 && (
            <Link
              href={ROUTES.trainingBrowse}
              className="mt-4 flex items-center justify-center rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-4 px-4 text-base min-h-[52px] touch-manipulation active:scale-[0.99] transition-transform"
            >
              All {total} exercises
            </Link>
          )}
        </>
      )}
    </section>
  );
}
