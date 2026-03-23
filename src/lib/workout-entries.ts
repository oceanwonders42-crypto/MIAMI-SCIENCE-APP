import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkoutEntry } from "@/types";

export async function getEntriesForWorkout(
  supabase: SupabaseClient,
  workoutId: string
): Promise<WorkoutEntry[]> {
  const { data, error } = await supabase
    .from("workout_entries")
    .select("*")
    .eq("workout_id", workoutId)
    .order("id", { ascending: true });
  if (error) return [];
  return (data ?? []) as WorkoutEntry[];
}

export type WorkoutEntryInsert = {
  workout_id: string;
  exercise_name: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  notes?: string | null;
};

export async function createWorkoutEntry(
  supabase: SupabaseClient,
  insert: WorkoutEntryInsert
): Promise<{ data: WorkoutEntry | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("workout_entries")
    .insert({
      ...insert,
      exercise_name: insert.exercise_name.trim(),
    })
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as WorkoutEntry, error: null };
}

export type WorkoutEntryUpdate = Partial<
  Pick<WorkoutEntry, "exercise_name" | "sets" | "reps" | "weight" | "notes">
>;

export async function updateWorkoutEntry(
  supabase: SupabaseClient,
  entryId: string,
  workoutId: string,
  userId: string,
  update: WorkoutEntryUpdate
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("workout_entries")
    .update({
      ...update,
      exercise_name: update.exercise_name?.trim() ?? undefined,
    })
    .eq("id", entryId)
    .eq("workout_id", workoutId);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function deleteWorkoutEntry(
  supabase: SupabaseClient,
  entryId: string,
  workoutId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("workout_entries")
    .delete()
    .eq("id", entryId)
    .eq("workout_id", workoutId);
  return { error: error ? new Error(error.message) : null };
}

/** Fetch entries for multiple workouts in one call (for list views). */
export async function getEntriesForWorkouts(
  supabase: SupabaseClient,
  workoutIds: string[]
): Promise<Map<string, WorkoutEntry[]>> {
  if (workoutIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("workout_entries")
    .select("*")
    .in("workout_id", workoutIds)
    .order("id", { ascending: true });
  if (error) return new Map();
  const rows = (data ?? []) as WorkoutEntry[];
  const map = new Map<string, WorkoutEntry[]>();
  for (const e of rows) {
    const list = map.get(e.workout_id) ?? [];
    list.push(e);
    map.set(e.workout_id, list);
  }
  return map;
}
