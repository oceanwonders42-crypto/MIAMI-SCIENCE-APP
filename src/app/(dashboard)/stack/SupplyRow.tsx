"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSupplyAction, deleteSupplyAction, adjustSupplyCountDeltaAction } from "./actions";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UpdateSupplyForm } from "./update-supply-form";
import { SupplyLevelBar } from "./SupplyLevelBar";
import {
  getDaysLeft,
  getRunoutDate,
  getSupplyLevelPercent,
  isLowSupply,
  isRunningLowSoon,
} from "@/lib/supplies";
import type { Supply } from "@/types";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { SUPPLY_ADD_UNIT_OPTIONS } from "@/lib/supply-add-units";

/** Add-form units plus legacy values for existing rows. */
const UNIT_OPTIONS = [
  ...SUPPLY_ADD_UNIT_OPTIONS,
  "servings",
  "scoops",
  "units",
  "tablets",
  "g",
];

interface SupplyRowProps {
  supply: Supply;
  /** When set, show a per-item refill/buy-again link. */
  refillUrl?: string | null;
  /** When set, show product image and use for card layout. */
  product?: Product | null;
}

export function SupplyRow({ supply, refillUrl, product }: SupplyRowProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bumpLoading, setBumpLoading] = useState(false);

  const days = getDaysLeft(supply);
  const runoutDate = getRunoutDate(supply);
  const low = isLowSupply(supply);
  const runningLowSoon = isRunningLowSoon(supply);
  const levelPct = getSupplyLevelPercent(supply);

  async function quickDelta(delta: number) {
    setError(null);
    setBumpLoading(true);
    const res = await adjustSupplyCountDeltaAction(supply.id, delta);
    setBumpLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const [form, setForm] = useState({
    name: supply.name,
    unit: supply.unit,
    current_count: String(supply.current_count),
    starting_quantity: supply.starting_quantity ?? "",
    threshold_alert: supply.threshold_alert ?? "",
    daily_use_estimate: supply.daily_use_estimate ?? "",
    label_strength: supply.label_strength ?? "",
    notes: supply.notes ?? "",
  });

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const current = Number(form.current_count);
    if (!Number.isFinite(current) || current < 0) {
      setError("Enter a valid current quantity (0 or more).");
      return;
    }
    setLoading(true);
    const result = await updateSupplyAction(supply.id, {
      name: form.name.trim(),
      unit: form.unit,
      current_count: current,
      starting_quantity:
        form.starting_quantity === ""
          ? undefined
          : Number(form.starting_quantity) || undefined,
      threshold_alert:
        form.threshold_alert === "" ? undefined : Number(form.threshold_alert),
      daily_use_estimate:
        form.daily_use_estimate === ""
          ? undefined
          : Number(form.daily_use_estimate) || undefined,
      label_strength: form.label_strength.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteSupplyAction(supply.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDeleteConfirm(false);
    router.refresh();
  }

  const showImage = product?.image_url != null && product.image_url.trim() !== "";

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-emerald-950/20 shadow-lg shadow-black/20",
          low && "border-amber-500/35 ring-1 ring-amber-500/20"
        )}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {showImage && (
              <div className="relative w-full sm:w-36 h-44 sm:h-auto sm:min-h-[140px] shrink-0 bg-zinc-800">
                <img
                  src={product!.image_url!}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}
            <div className={cn("flex flex-1 flex-col justify-between gap-4", showImage ? "p-4" : "p-4")}>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-zinc-100 text-lg">{supply.name}</span>
                  {low && <Badge variant="warning">Low</Badge>}
                  {runningLowSoon && !low && (
                    <Badge variant="outline" className="border-teal-500/30 text-teal-200/90">
                      Soon
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-400">
                  <span className="font-semibold tabular-nums text-zinc-200">{supply.current_count}</span>{" "}
                  {supply.unit} left
                  {days != null && (
                    <span className="text-zinc-500">
                      {" "}
                      · ~{days}d
                      {runoutDate &&
                        ` · ~${new Date(runoutDate + "T12:00:00Z").toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}`}
                    </span>
                  )}
                </p>
                <SupplyLevelBar percent={levelPct} low={low} />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 w-full sm:w-auto sm:mr-1">
                  Quick qty
                </span>
                <button
                  type="button"
                  disabled={bumpLoading || supply.current_count <= 0}
                  onClick={() => void quickDelta(-1)}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-100 font-bold py-3 px-4 min-h-[48px] min-w-[52px] touch-manipulation active:scale-[0.97] disabled:opacity-40"
                  aria-label="Decrease quantity by one"
                >
                  −1
                </button>
                <button
                  type="button"
                  disabled={bumpLoading}
                  onClick={() => void quickDelta(1)}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 font-bold py-3 px-4 min-h-[48px] min-w-[52px] touch-manipulation active:scale-[0.97]"
                  aria-label="Increase quantity by one"
                >
                  +1
                </button>
                <UpdateSupplyForm supply={supply} />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {refillUrl && (
                  <a
                    href={refillUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-5 text-sm min-h-[48px] inline-flex items-center justify-center touch-manipulation active:scale-[0.98] shadow-md shadow-emerald-900/30"
                  >
                    Reorder
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10 min-h-[48px] touch-manipulation"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 min-h-[48px] touch-manipulation"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="font-semibold">Edit supply</h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleUpdate} className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Label strength (e.g. 10mg)</label>
                  <input
                    type="text"
                    value={form.label_strength}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, label_strength: e.target.value }))
                    }
                    placeholder="Optional — as on vial"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Product name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <select
                      value={form.unit}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, unit: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Current quantity *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.current_count}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, current_count: e.target.value }))
                      }
                      required
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Starting quantity (for level bar)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.starting_quantity}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, starting_quantity: e.target.value }))
                    }
                    placeholder="Optional — defaults from current if empty"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Alert when below
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.threshold_alert}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, threshold_alert: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Daily use (for days left)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={form.daily_use_estimate}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          daily_use_estimate: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-sm text-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white py-2 text-sm disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-sm p-4">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
              Delete &quot;{supply.name}&quot;? This cannot be undone.
            </p>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-sm text-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm disabled:opacity-50"
              >
                {loading ? "…" : "Delete"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
