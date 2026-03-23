/**
 * Persist exercise logs when the device is offline; flush when back online.
 * Only applies to entries for an existing server workout (workout must be created online).
 */

import type { WorkoutEntry } from "@/types";

const STORAGE_KEY = "mst_training_offline_queue_v1";

export type PendingExerciseEntry = {
  workoutId: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  notes: string | null;
  queuedAt: string;
  clientId: string;
};

/** Pending rows use ids like `off_…` — not valid server UUIDs. */
export function isOfflineQueuedEntryId(id: string): boolean {
  return id.startsWith("off_");
}

export function pendingEntryToWorkoutEntry(p: PendingExerciseEntry): WorkoutEntry {
  return {
    id: p.clientId,
    workout_id: p.workoutId,
    exercise_name: p.exercise_name,
    sets: p.sets,
    reps: p.reps,
    weight: p.weight,
    notes: p.notes,
  };
}

function loadAll(): PendingExerciseEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PendingExerciseEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAll(items: PendingExerciseEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function notifyOfflineQueueChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mst-offline-queue-changed"));
}

export function enqueuePendingExerciseEntry(
  workoutId: string,
  payload: Omit<PendingExerciseEntry, "queuedAt" | "clientId" | "workoutId">
): PendingExerciseEntry {
  const entry: PendingExerciseEntry = {
    workoutId,
    exercise_name: payload.exercise_name,
    sets: payload.sets,
    reps: payload.reps,
    weight: payload.weight,
    notes: payload.notes,
    queuedAt: new Date().toISOString(),
    clientId: `off_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  };
  const all = loadAll();
  all.push(entry);
  saveAll(all);
  notifyOfflineQueueChanged();
  return entry;
}

export function getPendingForWorkout(workoutId: string): PendingExerciseEntry[] {
  return loadAll().filter((e) => e.workoutId === workoutId);
}

export function getPendingCount(): number {
  return loadAll().length;
}

export function removePendingByClientId(clientId: string) {
  const all = loadAll().filter((e) => e.clientId !== clientId);
  saveAll(all);
  notifyOfflineQueueChanged();
}

export function clearWorkoutPending(workoutId: string) {
  const all = loadAll().filter((e) => e.workoutId !== workoutId);
  saveAll(all);
  notifyOfflineQueueChanged();
}

/** All pending entries, oldest first (for sync). */
export function getAllPendingEntries(): PendingExerciseEntry[] {
  return loadAll().sort(
    (a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()
  );
}
