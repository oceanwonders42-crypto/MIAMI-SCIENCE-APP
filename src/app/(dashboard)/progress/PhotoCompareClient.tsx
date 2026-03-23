"use client";

import { useCallback, useMemo, useState } from "react";
import type { ProgressPhotoSigned } from "@/lib/progress-photos";

export function PhotoCompareClient({ photos }: { photos: ProgressPhotoSigned[] }) {
  const sorted = useMemo(
    () =>
      [...photos].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      ),
    [photos]
  );

  const [leftId, setLeftId] = useState<string>(() => sorted[0]?.id ?? "");
  const [rightId, setRightId] = useState<string>(() => sorted[sorted.length - 1]?.id ?? "");
  const [slider, setSlider] = useState(50);

  const byId = useMemo(() => new Map(sorted.map((p) => [p.id, p])), [sorted]);
  const left = byId.get(leftId);
  const right = byId.get(rightId);

  const onMove = useCallback((clientX: number, el: HTMLDivElement) => {
    const r = el.getBoundingClientRect();
    const x = clientX - r.left;
    const pct = Math.min(100, Math.max(0, (x / r.width) * 100));
    setSlider(pct);
  }, []);

  if (sorted.length < 2) {
    return (
      <div className="rounded-3xl border border-dashed border-white/[0.1] bg-zinc-900/30 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-zinc-300">Add two photos to compare</p>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
          Upload a second progress shot — then drag the slider to reveal before vs after.
        </p>
      </div>
    );
  }

  function setOldestNewest() {
    setLeftId(sorted[0]!.id);
    setRightId(sorted[sorted.length - 1]!.id);
    setSlider(50);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={setOldestNewest}
          className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-100 text-xs font-bold px-4 py-2.5 uppercase tracking-wider"
        >
          Oldest vs newest
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            Before
          </label>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.1] bg-black/30 px-3 py-2.5 text-sm text-zinc-100"
          >
            {sorted.map((p) => (
              <option key={p.id} value={p.id}>
                {new Date(p.recorded_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
            After
          </label>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.1] bg-black/30 px-3 py-2.5 text-sm text-zinc-100"
          >
            {sorted.map((p) => (
              <option key={p.id} value={p.id}>
                {new Date(p.recorded_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        role="presentation"
        className="relative mx-auto max-w-md cursor-ew-resize select-none rounded-3xl overflow-hidden border border-white/[0.1] bg-black shadow-2xl shadow-black/50 aspect-[3/4]"
        onClick={(e) => onMove(e.clientX, e.currentTarget)}
      >
        {right?.signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={right.signedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
        >
          {left?.signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={left.signedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-zinc-800" />
          )}
        </div>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
          style={{ left: `${slider}%`, transform: "translateX(-50%)" }}
        />
        <div
          className="absolute top-1/2 z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-zinc-900/90 text-white shadow-xl pointer-events-none"
          style={{ left: `${slider}%` }}
          aria-hidden
        >
          <span className="text-lg">↔</span>
        </div>
        <p className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] font-bold uppercase tracking-wider pointer-events-none z-10">
          <span className="rounded-full bg-black/60 px-2 py-1 text-emerald-300/95">Before</span>
          <span className="rounded-full bg-black/60 px-2 py-1 text-teal-300/95">After</span>
        </p>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={slider}
        onChange={(e) => setSlider(Number(e.target.value))}
        className="w-full accent-emerald-500"
        aria-label="Compare before and after"
      />
      <p className="text-center text-xs text-zinc-500">Drag the slider or use the handle on the image</p>
    </div>
  );
}
