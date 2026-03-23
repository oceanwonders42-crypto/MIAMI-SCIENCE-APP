"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { submitCheckInAction } from "@/app/(dashboard)/dashboard/actions";
import type { CheckIn } from "@/types";

interface CheckInCardProps {
  todayCheckIn: CheckIn | null;
  /** When true, render without Card wrapper (e.g. inside TodayBlock hero). */
  embedded?: boolean;
}

export function CheckInCard({ todayCheckIn, embedded }: CheckInCardProps) {
  const router = useRouter();
  const [routineDone, setRoutineDone] = useState(todayCheckIn?.routine_done ?? false);
  const [workedOut, setWorkedOut] = useState(todayCheckIn?.worked_out ?? false);
  const [note, setNote] = useState(todayCheckIn?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCheckedIn = todayCheckIn != null;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await submitCheckInAction({
      routine_done: routineDone,
      worked_out: workedOut,
      note: note.trim() || null,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const inputClass = embedded
    ? "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500"
    : "w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50";

  const formContent = (
    <>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={routineDone}
              onChange={(e) => setRoutineDone(e.target.checked)}
              className="rounded border-zinc-700 text-primary-400 focus:ring-primary-500/50"
            />
            <span className="text-sm text-zinc-300">Routine done today</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={workedOut}
              onChange={(e) => setWorkedOut(e.target.checked)}
              className="rounded border-zinc-700 text-primary-400 focus:ring-primary-500/50"
            />
            <span className="text-sm text-zinc-300">Worked out today</span>
          </label>
        </div>
        <div>
          <label className="block text-sm text-zinc-500 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Energy, mood, or short note"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold py-3 text-sm disabled:opacity-50 transition-colors border border-white/10"
        >
          {loading ? "Saving…" : hasCheckedIn ? "Update check-in" : "Save check-in"}
        </button>
      </form>
      {hasCheckedIn && (
        <p className="text-xs text-zinc-500">
          You checked in today. Update above to change.
        </p>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="min-w-0">
        <div className="space-y-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Daily check-in
          </h3>
          <p className="text-xs text-zinc-400">{today}</p>
        </div>
        <div className="space-y-3 pt-3">{formContent}</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily check-in</CardTitle>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{today}</p>
      </CardHeader>
      <CardContent className="space-y-4">{formContent}</CardContent>
    </Card>
  );
}
