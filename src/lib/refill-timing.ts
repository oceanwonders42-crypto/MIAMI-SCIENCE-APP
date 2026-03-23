import type { Supply } from "@/types";
import {
  getDaysLeft,
  getRunoutDate,
  isLowSupply,
  isRunningLowSoon,
} from "./supplies";

export type RefillStatus = "ok" | "reorder_soon" | "low" | "critical";

export interface RefillTimingForSupply {
  supply: Supply;
  status: RefillStatus;
  daysLeft: number | null;
  runoutDate: string | null;
  /** Suggested date to place reorder (e.g. 7 days before runout). */
  reorderByDate: string | null;
  message: string;
}

const RECOMMENDED_LEAD_DAYS = 7;

export function getRefillTiming(supply: Supply): RefillTimingForSupply {
  const daysLeft = getDaysLeft(supply);
  const runoutDate = getRunoutDate(supply);
  const low = isLowSupply(supply);
  const soon = isRunningLowSoon(supply);

  let status: RefillStatus = "ok";
  let message = "Supply is in good standing.";

  if (low) {
    status = daysLeft != null && daysLeft <= 3 ? "critical" : "low";
    message =
      daysLeft != null && daysLeft <= 0
        ? "Out or nearly out. Reorder as soon as possible."
        : daysLeft != null && daysLeft <= 3
          ? "Very low. Reorder soon to avoid running out."
          : "Below your alert threshold. Consider reordering.";
  } else if (soon && daysLeft != null) {
    status = "reorder_soon";
    message = `About ${daysLeft} days left. Reorder in the next week or two to stay stocked.`;
  } else if (daysLeft != null && daysLeft <= 30) {
    status = "reorder_soon";
    message =
      runoutDate != null
        ? `Estimated runout around ${new Date(runoutDate + "T12:00:00Z").toLocaleDateString()}. Plan a refill before then.`
        : `About ${daysLeft} days left. Plan a refill when convenient.`;
  } else if (runoutDate != null) {
    message = `Estimated runout around ${new Date(runoutDate + "T12:00:00Z").toLocaleDateString()}.`;
  }

  let reorderByDate: string | null = null;
  if (runoutDate != null && daysLeft != null && daysLeft > 0) {
    const d = new Date(runoutDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - RECOMMENDED_LEAD_DAYS);
    reorderByDate = d.toISOString().slice(0, 10);
  }

  return {
    supply,
    status,
    daysLeft,
    runoutDate,
    reorderByDate,
    message,
  };
}

export interface RefillSummary {
  reorderSoonCount: number;
  lowCount: number;
  criticalCount: number;
  nextRunoutDate: string | null;
  nextRunoutSupplyName: string | null;
  /** Suggested date to reorder by (for the soonest runout). */
  recommendedReorderByDate: string | null;
}

export function getRefillSummary(supplies: Supply[]): RefillSummary {
  const timings = supplies.map(getRefillTiming);
  const reorderSoonCount = timings.filter((t) => t.status === "reorder_soon").length;
  const lowCount = timings.filter((t) => t.status === "low").length;
  const criticalCount = timings.filter((t) => t.status === "critical").length;
  const withRunout = timings.filter((t) => t.runoutDate != null);
  const next = withRunout.sort(
    (a, b) => (a.runoutDate! > b.runoutDate! ? 1 : -1)
  )[0] ?? null;
  return {
    reorderSoonCount,
    lowCount,
    criticalCount,
    nextRunoutDate: next?.runoutDate ?? null,
    nextRunoutSupplyName: next?.supply.name ?? null,
    recommendedReorderByDate: next?.reorderByDate ?? null,
  };
}
