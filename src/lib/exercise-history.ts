import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkoutEntry } from "@/types";

export interface ExerciseHistoryItem {
  exerciseName: string;
  lastLoggedAt: string;
  workoutId: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  notes: string | null;
}

/**
 * Recent exercise history: one row per exercise name with latest logged stats.
 * Fetches user's workouts then their entries, dedupes by exercise name (keep latest).
 */
export async function getRecentExerciseHistory(
  supabase: SupabaseClient,
  userId: string,
  limit = 30
): Promise<ExerciseHistoryItem[]> {
  const { data: workouts, error: we } = await supabase
    .from("workouts")
    .select("id, started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(50);
  if (we || !workouts?.length) return [];
  const workoutIds = workouts.map((w) => w.id);
  const startedBy = new Map(workouts.map((w) => [w.id, w.started_at]));

  const { data: entries, error: ee } = await supabase
    .from("workout_entries")
    .select("*")
    .in("workout_id", workoutIds);
  if (ee) return [];
  const rows = (entries ?? []) as WorkoutEntry[];
  rows.sort((a, b) => {
    const da = startedBy.get(a.workout_id) ?? "";
    const db = startedBy.get(b.workout_id) ?? "";
    return new Date(db).getTime() - new Date(da).getTime();
  });

  const byExercise = new Map<string, ExerciseHistoryItem>();
  for (const r of rows) {
    const name = (r.exercise_name ?? "").trim();
    if (!name) continue;
    if (byExercise.has(name)) continue;
    const started = startedBy.get(r.workout_id) ?? "";
    byExercise.set(name, {
      exerciseName: name,
      lastLoggedAt: started,
      workoutId: r.workout_id,
      sets: r.sets ?? null,
      reps: r.reps ?? null,
      weight: r.weight ?? null,
      notes: r.notes ?? null,
    });
  }
  return Array.from(byExercise.values())
    .sort((a, b) => new Date(b.lastLoggedAt).getTime() - new Date(a.lastLoggedAt).getTime())
    .slice(0, limit);
}

/** PR = highest logged weight per exercise (from workout_entries). */
export interface ExercisePR {
  exerciseName: string;
  maxWeight: number;
  workoutId: string;
  loggedAt: string;
}

export async function getExercisePRs(
  supabase: SupabaseClient,
  userId: string
): Promise<ExercisePR[]> {
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, started_at")
    .eq("user_id", userId);
  if (!workouts?.length) return [];
  const workoutIds = workouts.map((w) => w.id);
  const startedBy = new Map(workouts.map((w) => [w.id, w.started_at]));

  const { data: entries, error } = await supabase
    .from("workout_entries")
    .select("exercise_name, weight, workout_id")
    .in("workout_id", workoutIds)
    .not("weight", "is", null);
  if (error) return [];

  const rows = (entries ?? []) as Array<{ exercise_name: string; weight: number; workout_id: string }>;
  const byExercise = new Map<string, ExercisePR>();
  for (const r of rows) {
    const name = (r.exercise_name ?? "").trim();
    if (!name || r.weight == null) continue;
    const w = Number(r.weight);
    const existing = byExercise.get(name);
    if (!existing || w > existing.maxWeight) {
      byExercise.set(name, {
        exerciseName: name,
        maxWeight: w,
        workoutId: r.workout_id,
        loggedAt: startedBy.get(r.workout_id) ?? "",
      });
    }
  }
  return Array.from(byExercise.values()).sort((a, b) => b.maxWeight - a.maxWeight);
}

/** All recent logs for a single exercise (for detail page). */
export async function getExerciseLogsByName(
  supabase: SupabaseClient,
  userId: string,
  exerciseName: string,
  limit = 10
): Promise<ExerciseHistoryItem[]> {
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(100);
  if (!workouts?.length) return [];
  const workoutIds = workouts.map((w) => w.id);
  const startedBy = new Map(workouts.map((w) => [w.id, w.started_at]));
  const name = exerciseName.trim();
  const { data: entries } = await supabase
    .from("workout_entries")
    .select("*")
    .in("workout_id", workoutIds)
    .ilike("exercise_name", name);
  if (!entries?.length) return [];
  const rows = (entries ?? []) as WorkoutEntry[];
  rows.sort((a, b) => {
    const da = startedBy.get(a.workout_id) ?? "";
    const db = startedBy.get(b.workout_id) ?? "";
    return new Date(db).getTime() - new Date(da).getTime();
  });
  return rows.slice(0, limit).map((r) => ({
    exerciseName: r.exercise_name,
    lastLoggedAt: startedBy.get(r.workout_id) ?? "",
    workoutId: r.workout_id,
    sets: r.sets ?? null,
    reps: r.reps ?? null,
    weight: r.weight ?? null,
    notes: r.notes ?? null,
  }));
}

/** Weight (kg) over time for sparkline / charts — chronological order. */
export async function getExerciseWeightSeries(
  supabase: SupabaseClient,
  userId: string,
  exerciseName: string,
  limit = 16
): Promise<{ at: string; weightKg: number }[]> {
  const items = await getExerciseLogsByName(supabase, userId, exerciseName, limit);
  return items
    .filter((i) => i.weight != null && Number(i.weight) > 0)
    .map((i) => ({
      at: i.lastLoggedAt,
      weightKg: Number(i.weight),
    }))
    .reverse();
}

/** Check if this entry's weight equals the user's PR for that exercise. */
export function isPRWeight(
  exerciseName: string,
  weight: number | null,
  prs: ExercisePR[]
): boolean {
  if (weight == null) return false;
  const pr = prs.find((p) => p.exerciseName.trim().toLowerCase() === exerciseName.trim().toLowerCase());
  return pr != null && Number(weight) >= pr.maxWeight;
}
