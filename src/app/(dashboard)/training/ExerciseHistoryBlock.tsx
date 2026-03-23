import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { isPRWeight } from "@/lib/exercise-history";
import type { ExerciseHistoryItem, ExercisePR } from "@/lib/exercise-history";

interface ExerciseHistoryBlockProps {
  items: ExerciseHistoryItem[];
  prs: ExercisePR[];
}

export function ExerciseHistoryBlock({ items, prs }: ExerciseHistoryBlockProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Log exercises inside a workout to see history here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-3">
        <ul className="space-y-2">
          {items.map((item) => {
            const parts = [
              item.sets != null && `${item.sets}×`,
              item.reps != null && item.reps,
              item.weight != null && `${item.weight} kg`,
            ].filter(Boolean);
            const isPR = isPRWeight(item.exerciseName, item.weight, prs);
            return (
              <li
                key={`${item.exerciseName}-${item.lastLoggedAt}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.exerciseName}</span>
                  {parts.length > 0 && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {parts.join(" ")}
                    </span>
                  )}
                  {isPR && <Badge variant="success">PR</Badge>}
                </div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {new Date(item.lastLoggedAt).toLocaleDateString()}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
