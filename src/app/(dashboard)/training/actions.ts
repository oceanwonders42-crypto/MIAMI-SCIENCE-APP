"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  createWorkout,
  updateWorkout,
  deleteWorkout,
  type WorkoutInsert,
} from "@/lib/workouts";
import {
  createWorkoutEntry,
  updateWorkoutEntry,
  deleteWorkoutEntry,
} from "@/lib/workout-entries";
import { revalidatePath } from "next/cache";

export async function createWorkoutAction(form: {
  started_at: string;
  workout_type?: string | null;
  name?: string | null;
  duration_minutes?: number | null;
  bodyweight_kg?: number | null;
  energy_score?: number | null;
  recovery_score?: number | null;
  notes?: string | null;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const insert: WorkoutInsert = {
    user_id: user.id,
    started_at: form.started_at,
    completed_at: form.started_at,
    workout_type: form.workout_type ?? null,
    name: form.name ?? form.workout_type ?? null,
    duration_minutes: form.duration_minutes ?? null,
    bodyweight_kg: form.bodyweight_kg ?? null,
    energy_score: form.energy_score ?? null,
    recovery_score: form.recovery_score ?? null,
    notes: form.notes?.trim() || null,
  };
  const { data, error } = await createWorkout(supabase, insert);
  if (error) return { success: false, error: error.message };
  revalidatePath("/training");
  revalidatePath("/dashboard");
  return { success: true, id: data!.id };
}

export async function updateWorkoutAction(
  workoutId: string,
  form: {
    started_at: string;
    workout_type?: string | null;
    name?: string | null;
    duration_minutes?: number | null;
    bodyweight_kg?: number | null;
    energy_score?: number | null;
    recovery_score?: number | null;
    notes?: string | null;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { error } = await updateWorkout(supabase, workoutId, user.id, {
    started_at: form.started_at,
    completed_at: form.started_at,
    workout_type: form.workout_type ?? null,
    name: form.name ?? form.workout_type ?? null,
    duration_minutes: form.duration_minutes ?? null,
    bodyweight_kg: form.bodyweight_kg ?? null,
    energy_score: form.energy_score ?? null,
    recovery_score: form.recovery_score ?? null,
    notes: form.notes?.trim() || null,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/training");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteWorkoutAction(
  workoutId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { error } = await deleteWorkout(supabase, workoutId, user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/training");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createExerciseEntryAction(
  workoutId: string,
  form: {
    exercise_name: string;
    sets?: number | null;
    reps?: number | null;
    weight?: number | null;
    notes?: string | null;
  }
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { data: workout } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();
  if (!workout) return { success: false, error: "Workout not found" };
  const name = form.exercise_name?.trim();
  if (!name) return { success: false, error: "Exercise name is required" };
  const { data, error } = await createWorkoutEntry(supabase, {
    workout_id: workoutId,
    exercise_name: name,
    sets: form.sets ?? null,
    reps: form.reps ?? null,
    weight: form.weight ?? null,
    notes: form.notes?.trim() || null,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/training");
  revalidatePath("/dashboard");
  revalidatePath(`/training/workout/${workoutId}`);
  return { success: true, id: data!.id };
}

export async function updateExerciseEntryAction(
  workoutId: string,
  entryId: string,
  form: {
    exercise_name: string;
    sets?: number | null;
    reps?: number | null;
    weight?: number | null;
    notes?: string | null;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const name = form.exercise_name?.trim();
  if (!name) return { success: false, error: "Exercise name is required" };
  const { error } = await updateWorkoutEntry(
    supabase,
    entryId,
    workoutId,
    user.id,
    {
      exercise_name: name,
      sets: form.sets ?? null,
      reps: form.reps ?? null,
      weight: form.weight ?? null,
      notes: form.notes?.trim() || null,
    }
  );
  if (error) return { success: false, error: error.message };
  revalidatePath("/training");
  revalidatePath("/dashboard");
  revalidatePath(`/training/workout/${workoutId}`);
  return { success: true };
}

export async function deleteExerciseEntryAction(
  workoutId: string,
  entryId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { data: workout } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single();
  if (!workout) return { success: false, error: "Workout not found" };
  const { error } = await deleteWorkoutEntry(supabase, entryId, workoutId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/training");
  revalidatePath("/dashboard");
  revalidatePath(`/training/workout/${workoutId}`);
  return { success: true };
}
