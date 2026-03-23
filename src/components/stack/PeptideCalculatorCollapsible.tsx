"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PEPTIDE_CALC_DISCLAIMER =
  "This calculator is for informational reference only. Not medical advice. Always follow guidance from your licensed healthcare professional.";

/**
 * Reference-only peptide concentration calculator (does not persist).
 * Shown when unit is ml or vials.
 */
export function PeptideCalculatorCollapsible({ unit }: { unit: string }) {
  const show = unit === "ml" || unit === "vials";
  const [open, setOpen] = useState(false);
  const [vialStrengthMg, setVialStrengthMg] = useState("");
  const [diluentMl, setDiluentMl] = useState("");

  if (!show) return null;

  const strengthNum = vialStrengthMg === "" ? null : Number(vialStrengthMg);
  const diluentNum = diluentMl === "" ? null : Number(diluentMl);
  const concentrationMgPerMl =
    strengthNum != null &&
    diluentNum != null &&
    Number.isFinite(strengthNum) &&
    Number.isFinite(diluentNum) &&
    diluentNum > 0
      ? strengthNum / diluentNum
      : null;

  return (
    <div className="rounded-xl border border-zinc-600/80 bg-zinc-900/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-zinc-100 hover:bg-white/5"
        aria-expanded={open}
      >
        Peptide calculator
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/10 px-3 pb-3 pt-3">
          <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-100/95">
            {PEPTIDE_CALC_DISCLAIMER}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Vial strength (mg)</label>
              <input
                type="number"
                min={0}
                step="any"
                value={vialStrengthMg}
                onChange={(e) => setVialStrengthMg(e.target.value)}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Diluent added (ml)</label>
              <input
                type="number"
                min={0}
                step="any"
                value={diluentMl}
                onChange={(e) => setDiluentMl(e.target.value)}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-100"
                placeholder="e.g. 2"
              />
            </div>
          </div>
          <div className="rounded-lg bg-black/30 px-3 py-2 text-sm">
            <span className="text-zinc-500">Concentration: </span>
            <span className="font-semibold tabular-nums text-emerald-400">
              {concentrationMgPerMl != null ? `${concentrationMgPerMl.toFixed(4)} mg/ml` : "—"}
            </span>
          </div>
          <p className="text-[10px] text-zinc-600">Does not save — reference only.</p>
        </div>
      )}
    </div>
  );
}
