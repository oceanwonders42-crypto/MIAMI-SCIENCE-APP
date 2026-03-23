import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupplies, isLowSupply, isRunningLowSoon } from "./supplies";
import { getRefillSummary } from "./refill-timing";
import { getReorderReminder } from "./reorder-reminders";
import { getOrderRetentionSummary } from "./order-retention";
import { getCheckIn, getCheckInStreaks, todayDateString } from "./check-ins";
import { getWorkoutStats } from "./workouts";
import { getDeliveredShipmentsNotUpdated } from "./shipment-inventory";
import { ROUTES } from "./constants";

export type AttentionType =
  | "low_supply"
  | "reorder_soon"
  | "overdue_reorder"
  | "delivered_not_added"
  | "comeback_checkin"
  | "comeback_workout";

export interface AttentionItem {
  id: string;
  type: AttentionType;
  priority: number;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
}

const COMEBACK_CHECKIN_DAYS = 3;
const COMEBACK_WORKOUT_DAYS = 7;

/**
 * Unified "what needs attention" list: low supply, reorder soon/overdue, delivered not added, comeback (check-in, workout).
 * Sorted by priority (lower = show first). Safe for dashboard and reminder center.
 */
export async function getAttentionItems(
  supabase: SupabaseClient,
  userId: string
): Promise<AttentionItem[]> {
  const items: AttentionItem[] = [];
  const today = todayDateString();

  const [
    supplies,
    checkInStreaks,
    todayCheckIn,
    workoutStats,
    deliveredNotUpdated,
    orderRetention,
  ] = await Promise.all([
    getSupplies(supabase, userId),
    getCheckInStreaks(supabase, userId),
    getCheckIn(supabase, userId, today),
    getWorkoutStats(supabase, userId),
    getDeliveredShipmentsNotUpdated(supabase, userId),
    getOrderRetentionSummary(supabase, userId, 20),
  ]);

  const refillSummary = getRefillSummary(supplies);
  const reorderReminder = getReorderReminder(
    supplies,
    refillSummary,
    orderRetention.lastOrderDate,
    orderRetention.daysSinceLastOrder
  );

  if (reorderReminder) {
    if (reorderReminder.state === "overdue" || reorderReminder.state === "reorder_soon") {
      items.push({
        id: "attention-reorder",
        type: reorderReminder.state === "overdue" ? "overdue_reorder" : "reorder_soon",
        priority: reorderReminder.state === "overdue" ? 1 : 3,
        title: reorderReminder.title,
        message: reorderReminder.message,
        ctaLabel: "View stack",
        ctaUrl: ROUTES.stack,
      });
    } else if (reorderReminder.state === "by_cadence") {
      items.push({
        id: "attention-cadence",
        type: "reorder_soon",
        priority: 4,
        title: reorderReminder.title,
        message: reorderReminder.message,
        ctaLabel: "View stack",
        ctaUrl: ROUTES.stack,
      });
    }
  }

  if (deliveredNotUpdated.length > 0) {
    items.push({
      id: "attention-delivered",
      type: "delivered_not_added",
      priority: 2,
      title: "Delivered — add to stack",
      message: `${deliveredNotUpdated.length} delivered shipment${deliveredNotUpdated.length !== 1 ? "s" : ""} not yet added to your stack.`,
      ctaLabel: "Add to stack",
      ctaUrl: ROUTES.orderShipmentAddToStack(deliveredNotUpdated[0].id),
    });
  }

  if (!todayCheckIn && checkInStreaks.lastCheckInDate) {
    const last = new Date(checkInStreaks.lastCheckInDate + "T12:00:00Z");
    const daysSince = Math.floor(
      (Date.now() - last.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSince >= COMEBACK_CHECKIN_DAYS) {
      items.push({
        id: "attention-comeback-checkin",
        type: "comeback_checkin",
        priority: 5,
        title: "Welcome back",
        message: `You haven’t checked in for ${daysSince} days. A quick check-in helps keep your routine on track.`,
        ctaLabel: "Check in",
        ctaUrl: ROUTES.dashboard,
      });
    }
  }

  if (workoutStats.lastWorkoutDate) {
    const lastWorkout = new Date(workoutStats.lastWorkoutDate + "T12:00:00Z");
    const daysSinceWorkout = Math.floor(
      (Date.now() - lastWorkout.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceWorkout >= COMEBACK_WORKOUT_DAYS) {
      items.push({
        id: "attention-comeback-workout",
        type: "comeback_workout",
        priority: 6,
        title: "Log a workout",
        message: `Last workout was ${daysSinceWorkout} days ago. Log one when you’re ready.`,
        ctaLabel: "Log workout",
        ctaUrl: ROUTES.training,
      });
    }
  }

  items.sort((a, b) => a.priority - b.priority);
  return items;
}
