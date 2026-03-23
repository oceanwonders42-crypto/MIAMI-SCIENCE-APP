"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createExerciseEntryAction } from "@/app/(dashboard)/training/actions";
import {
  getAllPendingEntries,
  removePendingByClientId,
} from "@/lib/training/offline-queue";

/**
 * Flushes queued exercise logs when online; shows a small banner when anything is pending.
 */
export function TrainingOfflineSync() {
  const router = useRouter();
  const [pending, setPending] = useState(0);

  const refresh = useCallback(() => {
    setPending(getAllPendingEntries().length);
  }, []);

  const flush = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const items = getAllPendingEntries();
    for (const item of items) {
      const res = await createExerciseEntryAction(item.workoutId, {
        exercise_name: item.exercise_name,
        sets: item.sets,
        reps: item.reps,
        weight: item.weight,
        notes: item.notes,
      });
      if (res.success) {
        removePendingByClientId(item.clientId);
      } else {
        break;
      }
    }
    refresh();
    router.refresh();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mst-workout-entries-synced"));
    }
  }, [refresh, router]);

  useEffect(() => {
    refresh();
    const onQ = () => refresh();
    window.addEventListener("mst-offline-queue-changed", onQ);
    window.addEventListener("online", flush);
    return () => {
      window.removeEventListener("mst-offline-queue-changed", onQ);
      window.removeEventListener("online", flush);
    };
  }, [refresh, flush]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void flush();
    }
  }, [flush]);

  if (pending === 0) return null;

  return (
    <div className="mx-4 md:mx-6 mt-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
      <p className="font-medium">{pending} set{pending !== 1 ? "s" : ""} saved offline</p>
      <p className="text-xs text-amber-200/70 mt-0.5">
        Will sync automatically when you&apos;re back online. You can also{" "}
        <button
          type="button"
          onClick={() => void flush()}
          className="underline font-semibold text-amber-50"
        >
          sync now
        </button>
        .
      </p>
    </div>
  );
}
