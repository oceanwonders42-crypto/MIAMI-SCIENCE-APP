/**
 * Saved workout templates (exercise names in order). Stored locally — no migration.
 */

const STORAGE_KEY = "mst_saved_workout_plans_v1";

export interface SavedWorkoutPlan {
  id: string;
  name: string;
  exercises: string[];
  createdAt: string;
}

function load(): SavedWorkoutPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as SavedWorkoutPlan[]) : [];
  } catch {
    return [];
  }
}

function save(plans: SavedWorkoutPlan[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function listSavedPlans(): SavedWorkoutPlan[] {
  return load().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getSavedPlan(id: string): SavedWorkoutPlan | null {
  return load().find((p) => p.id === id) ?? null;
}

export function upsertSavedPlan(plan: Omit<SavedWorkoutPlan, "createdAt"> & { createdAt?: string }) {
  const plans = load();
  const idx = plans.findIndex((p) => p.id === plan.id);
  const row: SavedWorkoutPlan = {
    id: plan.id,
    name: plan.name.trim(),
    exercises: plan.exercises.map((e) => e.trim()).filter(Boolean),
    createdAt: plan.createdAt ?? new Date().toISOString(),
  };
  if (idx >= 0) plans[idx] = row;
  else plans.push(row);
  save(plans);
}

export function createSavedPlan(name: string, exercises: string[]): SavedWorkoutPlan {
  const plan: SavedWorkoutPlan = {
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || "My plan",
    exercises: exercises.map((e) => e.trim()).filter(Boolean),
    createdAt: new Date().toISOString(),
  };
  const plans = load();
  plans.push(plan);
  save(plans);
  return plan;
}

export function deleteSavedPlan(id: string) {
  save(load().filter((p) => p.id !== id));
}

/** sessionStorage key: queue of exercise names to suggest after starting from a plan */
export const PLAN_QUEUE_KEY = "mst_plan_exercise_queue";

export function setPlanExerciseQueue(names: string[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PLAN_QUEUE_KEY, JSON.stringify(names));
}

export function consumePlanExerciseQueue(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(PLAN_QUEUE_KEY);
    sessionStorage.removeItem(PLAN_QUEUE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as string[]).filter((s) => typeof s === "string" && s.trim()) : [];
  } catch {
    return [];
  }
}
