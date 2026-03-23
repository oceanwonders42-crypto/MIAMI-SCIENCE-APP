import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkoutStats } from "./workouts";
import { getCheckInStreaks } from "./check-ins";
import { getSupplies, isLowSupply } from "./supplies";
import { getRewardBalance, getPointsChangeInRange } from "./rewards";
import { getOrderRetentionSummary } from "./order-retention";
import { getRefillSummary } from "./refill-timing";

/** Start of current week (Sunday 00:00 UTC) and end (Saturday 23:59 UTC). */
function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getUTCDay();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export type RefillUrgency = "none" | "soon" | "low" | "critical";

export interface WeeklyRecapData {
  workoutsThisWeek: number;
  checkInsThisWeek: number;
  checkInStreak: number;
  workoutStreak: number;
  lowSupplyCount: number;
  pointsBalance: number;
  pointsChangeThisWeek: number;
  weekStart: string;
  weekEnd: string;
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  /** Average days between orders when 2+ orders exist. */
  avgDaysBetweenOrders: number | null;
  refillUrgency: RefillUrgency;
}

function getRefillUrgencyFromSupplies(supplies: { length: number }, refillSummary: ReturnType<typeof getRefillSummary>): RefillUrgency {
  if (supplies.length === 0) return "none";
  if (refillSummary.criticalCount > 0) return "critical";
  if (refillSummary.lowCount > 0) return "low";
  if (refillSummary.reorderSoonCount > 0) return "soon";
  return "none";
}

export async function getWeeklyRecap(
  supabase: SupabaseClient,
  userId: string
): Promise<WeeklyRecapData> {
  const { start, end } = getWeekBounds();
  const [workoutStats, checkInStreaks, supplies, pointsBalance, pointsChangeThisWeek, orderRetention] =
    await Promise.all([
      getWorkoutStats(supabase, userId),
      getCheckInStreaks(supabase, userId),
      getSupplies(supabase, userId),
      getRewardBalance(supabase, userId),
      getPointsChangeInRange(supabase, userId, start, end),
      getOrderRetentionSummary(supabase, userId, 5),
    ]);

  const checkInsThisWeek = await getCheckInsInWeek(supabase, userId, start, end);
  const lowSupplyCount = supplies.filter((s) => isLowSupply(s)).length;
  const refillSummary = getRefillSummary(supplies);
  const refillUrgency = getRefillUrgencyFromSupplies(supplies, refillSummary);

  return {
    workoutsThisWeek: workoutStats.workoutsThisWeek,
    checkInsThisWeek,
    checkInStreak: checkInStreaks.currentStreak,
    workoutStreak: workoutStats.currentStreak,
    lowSupplyCount,
    pointsBalance: pointsBalance,
    pointsChangeThisWeek,
    weekStart: start,
    weekEnd: end,
    lastOrderDate: orderRetention.lastOrderDate,
    daysSinceLastOrder: orderRetention.daysSinceLastOrder,
    avgDaysBetweenOrders: orderRetention.avgDaysBetweenOrders,
    refillUrgency,
  };
}

async function getCheckInsInWeek(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string
): Promise<number> {
  const { count, error } = await supabase
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("check_in_date", start)
    .lte("check_in_date", end);
  if (error) return 0;
  return count ?? 0;
}
