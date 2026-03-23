import type { AttentionItem } from "@/lib/attention-items";
import type { WeeklyRecapData } from "@/lib/weekly-recap";
import type { ReorderReminderPayload, ComebackReminderPayload, WeeklyRecapPayload } from "./types";

/**
 * Build reorder reminder payload from the first reorder-type attention item.
 */
export function buildReorderPayloadFromAttention(items: AttentionItem[]): ReorderReminderPayload | null {
  const item = items.find((i) => i.type === "overdue_reorder" || i.type === "reorder_soon");
  if (!item) return null;
  return {
    title: item.title,
    message: item.message,
    ctaLabel: item.ctaLabel,
    ctaUrl: item.ctaUrl,
  };
}

/**
 * Build comeback reminder payload from the first comeback-type attention item.
 */
export function buildComebackPayloadFromAttention(items: AttentionItem[]): ComebackReminderPayload | null {
  const item = items.find((i) => i.type === "comeback_checkin" || i.type === "comeback_workout");
  if (!item) return null;
  return {
    title: item.title,
    message: item.message,
    ctaLabel: item.ctaLabel,
    ctaUrl: item.ctaUrl,
  };
}

/**
 * Build weekly recap payload from WeeklyRecapData.
 */
export function buildWeeklyRecapPayload(data: WeeklyRecapData): WeeklyRecapPayload {
  const weekLabel =
    new Date(data.weekStart + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " – " +
    new Date(data.weekEnd + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return {
    weekLabel,
    workoutsThisWeek: data.workoutsThisWeek,
    checkInsThisWeek: data.checkInsThisWeek,
    checkInStreak: data.checkInStreak,
    workoutStreak: data.workoutStreak,
    lowSupplyCount: data.lowSupplyCount,
    pointsBalance: data.pointsBalance,
    pointsChangeThisWeek: data.pointsChangeThisWeek,
    lastOrderDate: data.lastOrderDate,
    daysSinceLastOrder: data.daysSinceLastOrder,
    refillUrgency: data.refillUrgency,
  };
}
