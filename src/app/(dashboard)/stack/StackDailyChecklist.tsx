"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSupplyDailyTakenAction } from "./actions";
import type { Supply } from "@/types";
import { cn } from "@/lib/utils";

interface StackDailyChecklistProps {
  supplies: Supply[];
  /** Supply IDs already marked taken for `todayKey`. */
  initialTakenIds: string[];
  /** YYYY-MM-DD in user timezone (for display / consistency). */
  todayKey: string;
  /** Human label e.g. "Tue, Mar 17" */
  todayLabel: string;
}

export function StackDailyChecklist({
  supplies,
  initialTakenIds,
  todayKey,
  todayLabel,
}: StackDailyChecklistProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [taken, setTaken] = useState(() => new Set(initialTakenIds));
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...supplies].sort((a, b) => a.name.localeCompare(b.name)),
    [supplies]
  );

  const doneCount = sorted.filter((s) => taken.has(s.id)).length;

  function toggle(supplyId: string, next: boolean) {
    setError(null);
    const wasTaken = taken.has(supplyId);
    setTaken((prevSet) => {
      const n = new Set(prevSet);
      if (next) n.add(supplyId);
      else n.delete(supplyId);
      return n;
    });
    startTransition(async () => {
      const res = await toggleSupplyDailyTakenAction(supplyId, next);
      if (!res.success) {
        setTaken((prevSet) => {
          const n = new Set(prevSet);
          if (wasTaken) n.add(supplyId);
          else n.delete(supplyId);
          return n;
        });
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (sorted.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Today&apos;s checklist
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{todayLabel}</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-emerald-300/90">
          {doneCount}/{sorted.length}
        </p>
      </div>
      {error && (
        <p className="text-xs text-red-400 px-1" role="alert">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {sorted.map((s) => {
          const isOn = taken.has(s.id);
          return (
            <li key={`${todayKey}-${s.id}`}>
              <button
                type="button"
                disabled={pending}
                onClick={() => toggle(s.id, !isOn)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-[0.99] touch-manipulation min-h-[56px]",
                  isOn
                    ? "border-emerald-500/35 bg-emerald-500/[0.12] shadow-sm shadow-emerald-950/20"
                    : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-colors",
                    isOn
                      ? "bg-emerald-500 text-zinc-950"
                      : "border-2 border-white/25 text-zinc-600"
                  )}
                  aria-hidden
                >
                  {isOn ? "✓" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-100 truncate">{s.name}</p>
                  <p className="text-[11px] text-zinc-500">
                    {isOn ? "Logged for today" : "Tap if you took it today"}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
