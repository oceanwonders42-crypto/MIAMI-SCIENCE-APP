"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { playRestCompleteAlerts } from "@/lib/training/rest-alerts";

const PRESETS = [30, 60, 90, 120, 180] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!isRunning || secondsLeft == null) return;
    if (secondsLeft <= 0) {
      if (!playedRef.current) {
        playedRef.current = true;
        playRestCompleteAlerts();
      }
      setIsRunning(false);
      setSecondsLeft(null);
      setShowDone(true);
      const t = setTimeout(() => setShowDone(false), 2200);
      return () => clearTimeout(t);
    }
    const t = setInterval(() => setSecondsLeft((s) => (s != null ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isRunning, secondsLeft]);

  const start = useCallback((seconds: number) => {
    playedRef.current = false;
    setSecondsLeft(seconds);
    setIsRunning(true);
    setShowDone(false);
  }, []);

  const cancel = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(null);
    playedRef.current = false;
  }, []);

  return (
    <div className="rounded-[1.25rem] border border-white/[0.07] bg-zinc-900/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 mb-3">
        Rest timer
      </p>
      {showDone ? (
        <p className="text-xl font-semibold text-emerald-400">Time&apos;s up</p>
      ) : secondsLeft != null && isRunning ? (
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "text-4xl font-semibold tabular-nums tracking-tight",
              secondsLeft > 10 ? "text-zinc-50" : "text-amber-400"
            )}
          >
            {formatTime(secondsLeft)}
          </span>
          <button
            type="button"
            onClick={cancel}
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200 font-semibold py-3 px-5 min-h-[48px] touch-manipulation active:scale-[0.98]"
          >
            Skip
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => start(sec)}
              className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-100 font-semibold py-3 px-4 min-h-[48px] text-sm touch-manipulation active:scale-[0.98] hover:bg-emerald-500/15"
            >
              {sec < 60 ? `${sec}s` : `${sec / 60}m`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
