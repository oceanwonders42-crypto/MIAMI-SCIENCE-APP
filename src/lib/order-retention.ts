import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrders } from "./orders";

export interface OrderRetentionSummary {
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  orderCount: number;
  /** Average days between consecutive orders (only if 2+ orders). */
  avgDaysBetweenOrders: number | null;
}

/**
 * Lightweight order-aware retention summary from linked order history.
 */
export async function getOrderRetentionSummary(
  supabase: SupabaseClient,
  userId: string,
  orderLimit = 20
): Promise<OrderRetentionSummary> {
  const orders = await getOrders(supabase, userId, orderLimit);
  if (orders.length === 0) {
    return {
      lastOrderDate: null,
      daysSinceLastOrder: null,
      orderCount: 0,
      avgDaysBetweenOrders: null,
    };
  }

  const sorted = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const last = sorted[0];
  const lastOrderDate = last.created_at.slice(0, 10);
  const daysSinceLastOrder = Math.floor(
    (Date.now() - new Date(lastOrderDate + "T12:00:00Z").getTime()) / (24 * 60 * 60 * 1000)
  );

  let avgDaysBetweenOrders: number | null = null;
  if (sorted.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = new Date(sorted[i].created_at).getTime();
      const b = new Date(sorted[i + 1].created_at).getTime();
      gaps.push(Math.floor((a - b) / (24 * 60 * 60 * 1000)));
    }
    avgDaysBetweenOrders = Math.round(
      gaps.reduce((s, g) => s + g, 0) / gaps.length
    );
  }

  return {
    lastOrderDate,
    daysSinceLastOrder,
    orderCount: orders.length,
    avgDaysBetweenOrders,
  };
}
