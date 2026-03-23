import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/types";
import { getOrders } from "@/lib/orders";

export interface PurchaseStats {
  totalOrders: number;
  totalSpentCents: number | null;
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  averageOrderValueCents: number | null;
  recentOrders: Order[];
}

const RECENT_ORDERS_LIMIT = 5;

/**
 * Compute purchase stats from a user's orders (order-level only; no product-level data).
 * Only includes orders with total_cents when computing spend/AOV.
 */
export function computePurchaseStats(orders: Order[]): PurchaseStats {
  const recentOrders = orders.slice(0, RECENT_ORDERS_LIMIT);
  const totalOrders = orders.length;

  const ordersWithTotal = orders.filter((o) => o.total_cents != null && o.total_cents >= 0);
  const totalSpentCents =
    ordersWithTotal.length > 0
      ? ordersWithTotal.reduce((sum, o) => sum + (o.total_cents ?? 0), 0)
      : null;
  const averageOrderValueCents =
    ordersWithTotal.length > 0 && totalSpentCents != null
      ? Math.round(totalSpentCents / ordersWithTotal.length)
      : null;

  const sortedByDate = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastOrder = sortedByDate[0];
  const lastOrderDate = lastOrder?.created_at ?? null;
  const daysSinceLastOrder =
    lastOrderDate != null
      ? Math.floor(
          (Date.now() - new Date(lastOrderDate).getTime()) / (24 * 60 * 60 * 1000)
        )
      : null;

  return {
    totalOrders,
    totalSpentCents,
    lastOrderDate,
    daysSinceLastOrder,
    averageOrderValueCents,
    recentOrders,
  };
}

/** Load orders for user and return purchase stats. */
export async function getPurchaseStatsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<PurchaseStats> {
  const orders = await getOrders(supabase, userId);
  return computePurchaseStats(orders);
}
