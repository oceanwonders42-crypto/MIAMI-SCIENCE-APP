"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSupplyQuantityFromShipmentAction } from "@/app/(dashboard)/stack/actions";
import type { Supply } from "@/types";
import { ROUTES } from "@/lib/constants";

interface UpdateSupplyFromShipmentFormProps {
  shipmentId: string;
  supplies: Supply[];
}

export function UpdateSupplyFromShipmentForm({
  shipmentId,
  supplies,
}: UpdateSupplyFromShipmentFormProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setError(null);
    const add = Number(quantity);
    if (!Number.isFinite(add) || add < 1) {
      setError("Enter a quantity (1 or more) to add.");
      return;
    }
    setLoading(true);
    const result = await addSupplyQuantityFromShipmentAction(
      selectedId,
      add,
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 text-sm p-3">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Supply item</label>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">Choose one…</option>
          {supplies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.current_count} {s.unit}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Quantity to add</label>
        <input
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 60"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !selectedId || !quantity.trim()}
        className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3 text-sm disabled:opacity-50"
      >
        {loading ? "Saving…" : "Add quantity & confirm"}
      </button>
    </form>
  );
}
