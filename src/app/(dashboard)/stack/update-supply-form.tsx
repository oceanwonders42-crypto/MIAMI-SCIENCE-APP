"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSupplyCountAction } from "./actions";
import type { Supply } from "@/types";

interface UpdateSupplyFormProps {
  supply: Supply;
}

export function UpdateSupplyForm({ supply }: UpdateSupplyFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(supply.current_count));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      setError("Enter a valid number (0 or more).");
      return;
    }
    setLoading(true);
    const result = await updateSupplyCountAction(supply.id, num);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-semibold text-teal-300/90 min-h-[48px] touch-manipulation"
      >
        Set qty
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65">
          <div className="w-full max-w-sm rounded-[1.25rem] border border-white/[0.08] bg-gradient-to-br from-zinc-900 to-teal-950/30 p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-zinc-50">Update quantity</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xl leading-none p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-3">
              {supply.name} ({supply.unit})
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-red-400">{error}</p>}
              <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3.5 text-lg font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[52px]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 text-sm font-bold disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
