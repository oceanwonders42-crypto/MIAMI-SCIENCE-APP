import type { SupabaseClient } from "@supabase/supabase-js";
import type { Workout } from "@/types";

export async function getWorkout(
  supabase: SupabaseClient,
  workoutId: string,
  userId: string
): Promise<Workout | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Workout;
}

export async function getRecentWorkouts(
  supabase: SupabaseClient,
  userId: string,
  limit = 10
): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Workout[];
}

export interface WorkoutStats {
  workoutsThisWeek: number;
  currentStreak: number;
  lastWorkoutDate: string | null;
}

/**
 * Workouts this week (Sun–Sat in user's week), current streak (consecutive days with at least one workout), last workout date.
 */
export async function getWorkoutStats(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkoutStats> {
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  if (error) {
    return { workoutsThisWeek: 0, currentStreak: 0, lastWorkoutDate: null };
  }
  const dates = (workouts ?? []).map((w) => w.started_at as string);

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeek = dates.filter((d) => new Date(d) >= oneWeekAgo);
  const workoutsThisWeek = thisWeek.length;

  const daySet = new Set(
    dates.map((d) => new Date(d).toISOString().slice(0, 10))
  );
  const uniqueDays = Array.from(daySet).sort((a, b) => (b > a ? 1 : -1));

  let currentStreak = 0;
  const check = new Date();
  for (let i = 0; i < 365; i++) {
    const day = check.toISOString().slice(0, 10);
    if (daySet.has(day)) {
      currentStreak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  const lastWorkoutDate =
    uniqueDays.length > 0 ? uniqueDays[0]! : null;

  return {
    workoutsThisWeek,
    currentStreak,
    lastWorkoutDate,
  };
}

export type WorkoutInsert = {
  user_id: string;
  name?: string | null;
  workout_type?: string | null;
  started_at: string;
  completed_at?: string | null;
  duration_minutes?: number | null;
  bodyweight_kg?: number | null;
  energy_score?: number | null;
  recovery_score?: number | null;
  notes?: string | null;
};

export async function createWorkout(
  supabase: SupabaseClient,
  insert: WorkoutInsert
): Promise<{ data: Workout | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("workouts")
    .insert(insert)
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as Workout, error: null };
}

export type WorkoutUpdate = Partial<
  Pick<
    Workout,
    | "name"
    | "workout_type"
    | "started_at"
    | "completed_at"
    | "duration_minutes"
    | "bodyweight_kg"
    | "energy_score"
    | "recovery_score"
    | "notes"
  >
>;

export async function updateWorkout(
  supabase: SupabaseClient,
  workoutId: string,
  userId: string,
  update: WorkoutUpdate
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("workouts")
    .update(update)
    .eq("id", workoutId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteWorkout(
  supabase: SupabaseClient,
  workoutId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}
