import type { Supply } from "@/types";
import { getRefillSummary, type RefillSummary } from "./refill-timing";

export type ReorderReminderState =
  | "ok"
  | "reorder_soon"
  | "overdue"
  | "by_cadence";

export interface ReorderReminderResult {
  state: ReorderReminderState;
  title: string;
  message: string;
  /** Suggested date to reorder by (YYYY-MM-DD). */
  reorderByDate: string | null;
  /** Count of items in this state. */
  itemCount: number;
}

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Smarter reorder reminder from supply/runout and optional last order date.
 * Conservative: only "overdue" when past recommended reorder-by date; "by_cadence" when we have order history and long gap.
 */
export function getReorderReminder(
  supplies: Supply[],
  refillSummary: RefillSummary,
  lastOrderDate: string | null,
  daysSinceLastOrder: number | null
): ReorderReminderResult | null {
  if (supplies.length === 0) return null;

  const { criticalCount, lowCount, reorderSoonCount, recommendedReorderByDate } = refillSummary;

  if (criticalCount > 0) {
    return {
      state: "overdue",
      title: "Reorder now",
      message: `${criticalCount} item${criticalCount !== 1 ? "s" : ""} at or below critical level. Reorder as soon as possible.`,
      reorderByDate: null,
      itemCount: criticalCount,
    };
  }

  if (lowCount > 0) {
    return {
      state: "overdue",
      title: "Low supply",
      message: `${lowCount} item${lowCount !== 1 ? "s" : ""} below your alert threshold. Consider reordering soon.`,
      reorderByDate: recommendedReorderByDate,
      itemCount: lowCount,
    };
  }

  if (recommendedReorderByDate && TODAY > recommendedReorderByDate && reorderSoonCount > 0) {
    return {
      state: "overdue",
      title: "Overdue to reorder",
      message: `Recommended reorder date was ${new Date(recommendedReorderByDate + "T12:00:00Z").toLocaleDateString()}. ${reorderSoonCount} item${reorderSoonCount !== 1 ? "s" : ""} running low soon.`,
      reorderByDate: recommendedReorderByDate,
      itemCount: reorderSoonCount,
    };
  }

  if (reorderSoonCount > 0) {
    return {
      state: "reorder_soon",
      title: "Reorder soon",
      message: recommendedReorderByDate
        ? `Order by ${new Date(recommendedReorderByDate + "T12:00:00Z").toLocaleDateString()} to stay stocked. ${reorderSoonCount} item${reorderSoonCount !== 1 ? "s" : ""} running low soon.`
        : `${reorderSoonCount} supply${reorderSoonCount !== 1 ? "ies" : ""} may run out in the next couple of weeks.`,
      reorderByDate: recommendedReorderByDate,
      itemCount: reorderSoonCount,
    };
  }

  if (
    lastOrderDate != null &&
    daysSinceLastOrder != null &&
    daysSinceLastOrder >= 45 &&
    supplies.length > 0
  ) {
    return {
      state: "by_cadence",
      title: "Time to reorder?",
      message: `Last order was ${daysSinceLastOrder} days ago. Update your stack or place an order when ready.`,
      reorderByDate: null,
      itemCount: 0,
    };
  }

  return null;
}
