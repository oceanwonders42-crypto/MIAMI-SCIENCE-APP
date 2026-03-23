"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupplyAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PeptideCalculatorCollapsible } from "@/components/stack/PeptideCalculatorCollapsible";
import { STACK_DISCLAIMER } from "@/lib/constants";
import { SUPPLY_ADD_UNIT_OPTIONS } from "@/lib/supply-add-units";

const OPEN_ADD_EVENT = "stack-open-add-supply";

export function SupplyForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    unit: "capsules",
    current_count: "",
    threshold_alert: "",
  });

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_ADD_EVENT, handler);
    return () => window.removeEventListener(OPEN_ADD_EVENT, handler);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = form.name.trim();
    if (!name) {
      setError("Product name is required.");
      return;
    }
    const current = Number(form.current_count);
    if (!Number.isFinite(current) || current < 0) {
      setError("Enter a valid current quantity (0 or more).");
      return;
    }
    setLoading(true);
    const result = await createSupplyAction({
      name,
      unit: form.unit,
      current_count: current,
      starting_quantity: current,
      threshold_alert: form.threshold_alert === "" ? null : Number(form.threshold_alert),
      daily_use_estimate: null,
      label_strength: null,
      notes: null,
    });
    if (!result.success) {
      setLoading(false);
      setError(result.error);
      return;
    }
    setLoading(false);
    setOpen(false);
    setForm({
      name: "",
      unit: "capsules",
      current_count: "",
      threshold_alert: "",
    });
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm"
      >
        Add supply
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add supply item</CardTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{STACK_DISCLAIMER}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Product name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                    placeholder="e.g. BPC-157"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                  >
                    {SUPPLY_ADD_UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Current quantity *</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.current_count}
                    onChange={(e) => setForm((p) => ({ ...p, current_count: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alert when below</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.threshold_alert}
                    onChange={(e) => setForm((p) => ({ ...p, threshold_alert: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>

                <PeptideCalculatorCollapsible unit={form.unit} />

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 py-2.5 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 text-sm disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Add"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
