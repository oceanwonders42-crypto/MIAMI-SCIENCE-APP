"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupplyAction } from "@/app/(dashboard)/stack/actions";
import type { ShipmentPrefill } from "@/lib/shipment-inventory";
import { ROUTES } from "@/lib/constants";
import { SUPPLY_ADD_UNIT_OPTIONS } from "@/lib/supply-add-units";
import { PeptideCalculatorCollapsible } from "@/components/stack/PeptideCalculatorCollapsible";

const LEGACY_UNITS = ["servings", "scoops", "units", "tablets", "g"] as const;
const SHIPMENT_UNIT_OPTIONS = [...SUPPLY_ADD_UNIT_OPTIONS, ...LEGACY_UNITS];

function normalizePrefillUnit(u: string): string {
  return (SHIPMENT_UNIT_OPTIONS as readonly string[]).includes(u) ? u : "capsules";
}

interface AddSupplyFromShipmentFormProps {
  shipmentId: string;
  prefill: ShipmentPrefill;
}

export function AddSupplyFromShipmentForm({
  shipmentId,
  prefill,
}: AddSupplyFromShipmentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: prefill.name,
    unit: normalizePrefillUnit(prefill.unit),
    current_count: String(prefill.current_count),
    threshold_alert: "",
  });

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
    const result = await createSupplyAction(
      {
        name,
        unit: form.unit,
        current_count: current,
        starting_quantity: current,
        threshold_alert: form.threshold_alert === "" ? null : Number(form.threshold_alert),
        daily_use_estimate: null,
        label_strength: null,
        notes: null,
      },
      shipmentId
    );
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`${ROUTES.stack}?inventoryUpdated=1`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-sm p-3">
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
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          placeholder="e.g. Vitamin D"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <select
            value={form.unit}
            onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            {SHIPMENT_UNIT_OPTIONS.map((u) => (
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Alert when below</label>
        <input
          type="number"
          min={0}
          step="any"
          value={form.threshold_alert}
          onChange={(e) => setForm((p) => ({ ...p, threshold_alert: e.target.value }))}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          placeholder="Optional"
        />
      </div>

      <PeptideCalculatorCollapsible unit={form.unit} />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm disabled:opacity-50"
        >
          {loading ? "Saving…" : "Add to stack"}
        </button>
      </div>
    </form>
  );
}
