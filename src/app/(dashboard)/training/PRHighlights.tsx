import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { nameToSlug } from "@/lib/exercises";
import { formatWeight } from "@/lib/units";
import type { ExercisePR } from "@/lib/exercise-history";
import type { PreferredUnits } from "@/lib/units";

interface PRHighlightsProps {
  prs: ExercisePR[];
  maxItems?: number;
  preferredUnits?: PreferredUnits;
}

export function PRHighlights({ prs, maxItems = 8, preferredUnits = "metric" }: PRHighlightsProps) {
  if (prs.length === 0) return null;

  const show = prs.slice(0, maxItems);

  return (
    <section>
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">PRs</h3>
      <div className="flex flex-wrap gap-2">
        {show.map((pr) => (
          <Link
            key={`${pr.exerciseName}-${pr.maxWeight}`}
            href={ROUTES.trainingExercise(nameToSlug(pr.exerciseName))}
            className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 active:scale-[0.98] transition-transform touch-manipulation"
          >
            {pr.exerciseName} {formatWeight(pr.maxWeight, preferredUnits)}
          </Link>
        ))}
      </div>
    </section>
  );
}
