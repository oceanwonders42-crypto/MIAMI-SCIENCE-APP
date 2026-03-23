import { createServerClient } from "@/lib/supabase/server";
import { getRecentWorkouts, getWorkoutStats } from "@/lib/workouts";
import { getEntriesForWorkouts } from "@/lib/workout-entries";
import { getRecentExerciseHistory, getExercisePRs, getExerciseWeightSeries } from "@/lib/exercise-history";
import { getProfile } from "@/lib/profile";
import { getExercisesByNameMap, getExercisesPreview, getExercisesCount } from "@/lib/exercises";
import type { ExerciseImageVariant } from "@/types";
import { Header } from "@/components/layout/Header";
import { TrainingHero } from "./TrainingHero";
import { TrainingStats } from "./TrainingStats";
import { PRHighlights } from "./PRHighlights";
import { ExerciseLibrarySection } from "./ExerciseLibrarySection";
import { ExerciseDiscoverySection } from "./ExerciseDiscoverySection";
import { WorkoutForm } from "./workout-form";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { WorkoutHistoryTimeline } from "@/components/training/WorkoutHistoryTimeline";
import { ExerciseWeightSparkline } from "@/components/training/ExerciseWeightSparkline";
import { SavedPlansQuickStart } from "@/components/training/SavedPlansQuickStart";

export default async function TrainingPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";
  const [workouts, stats, exerciseHistory, prs, exercisesByName, libraryPreview, libraryTotalCount, profile] =
    await Promise.all([
      getRecentWorkouts(supabase, userId),
      getWorkoutStats(supabase, userId),
      getRecentExerciseHistory(supabase, userId, 24),
      getExercisePRs(supabase, userId),
      getExercisesByNameMap(supabase),
      getExercisesPreview(supabase, 6),
      getExercisesCount(supabase),
      getProfile(supabase, userId),
    ]);
  const exerciseImageVariant: ExerciseImageVariant =
    profile?.exercise_image_variant === "women" ? "women" : "men";
  const preferredUnits = profile?.preferred_units === "imperial" ? "imperial" : "metric";
  const workoutIds = workouts.map((w) => w.id);
  const entriesByWorkout = await getEntriesForWorkouts(supabase, workoutIds);

  const chartNames = [...new Map(prs.map((p) => [p.exerciseName.toLowerCase(), p.exerciseName])).values()].slice(
    0,
    3
  );
  const weightSeries = await Promise.all(
    chartNames.map(async (name) => ({
      name,
      points: await getExerciseWeightSeries(supabase, userId, name, 20),
    }))
  );

  return (
    <>
      <Header
        title="Training"
        subtitle="Log sets. Stack when you need it."
        action={<WorkoutForm preferredUnits={preferredUnits} />}
      />
      <div className="px-4 md:px-6 pb-10">
        <div className="rounded-[1.5rem] border border-white/[0.06] bg-gradient-to-b from-zinc-900/95 via-zinc-950/90 to-zinc-950 p-5 md:p-6 space-y-8 shadow-xl shadow-black/20">
          <TrainingHero />
          <TrainingStats stats={stats} />
          <PRHighlights prs={prs} preferredUnits={preferredUnits} />
          <SavedPlansQuickStart
            exerciseLookup={Array.from(exercisesByName.values()).map((e) => ({
              name: e.name,
              slug: e.slug,
              image_url: e.image_url,
              category: e.category,
            }))}
            exerciseImageVariant={exerciseImageVariant}
          />
          <WorkoutHistoryTimeline workouts={workouts} entriesByWorkout={entriesByWorkout} />
          <section className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 px-0.5">
              Weight trend
            </p>
            <p className="text-xs text-zinc-500 -mt-1 px-0.5">
              Heaviest lifts over recent sessions (up to 3 exercises).
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {weightSeries.map(({ name, points }) => (
                <ExerciseWeightSparkline
                  key={name}
                  title={name}
                  points={points}
                  preferredUnits={preferredUnits}
                />
              ))}
              {weightSeries.length === 0 && (
                <p className="text-sm text-zinc-500 col-span-full">
                  Log weighted sets to see progress charts here.
                </p>
              )}
            </div>
          </section>
          <ExerciseLibrarySection
            exercises={libraryPreview}
            totalCount={libraryTotalCount}
            exerciseImageVariant={exerciseImageVariant}
          />
          <ExerciseDiscoverySection
            history={exerciseHistory}
            prs={prs}
            exercisesByName={exercisesByName}
            exerciseImageVariant={exerciseImageVariant}
          />
        </div>
        <Disclaimer compact className="text-center mt-8" />
      </div>
    </>
  );
}
