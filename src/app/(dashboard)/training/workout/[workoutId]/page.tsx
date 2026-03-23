import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getWorkout } from "@/lib/workouts";
import { getEntriesForWorkout } from "@/lib/workout-entries";
import { getExercisePRs } from "@/lib/exercise-history";
import { getProfile } from "@/lib/profile";
import { getExercises } from "@/lib/exercises";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/lib/constants";
import { WorkoutSessionContent } from "../WorkoutSessionContent";

interface PageProps {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ exercise?: string }>;
}

export default async function WorkoutSessionPage({
  params,
  searchParams,
}: PageProps) {
  const { workoutId } = await params;
  const { exercise: prefillExercise } = await searchParams;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const workout = await getWorkout(supabase, workoutId, userId);
  if (!workout) notFound();

  const [entries, prs, profile, exercises] = await Promise.all([
    getEntriesForWorkout(supabase, workoutId),
    getExercisePRs(supabase, userId),
    getProfile(supabase, userId),
    getExercises(supabase),
  ]);
  const exerciseImageVariant = profile?.exercise_image_variant === "women" ? "women" : "men";
  const preferredUnits = profile?.preferred_units === "imperial" ? "imperial" : "metric";

  return (
    <>
      <Header
        title={workout.workout_type ?? workout.name ?? "Workout"}
        subtitle={new Date(workout.started_at).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
        backHref={ROUTES.training}
      />
      <WorkoutSessionContent
        workout={workout}
        entries={entries}
        prs={prs}
        prefillExerciseName={prefillExercise ?? null}
        exercises={exercises}
        exerciseImageVariant={exerciseImageVariant}
        preferredUnits={preferredUnits}
      />
    </>
  );
}
