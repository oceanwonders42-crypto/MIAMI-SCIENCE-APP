import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/types";

export async function getOrderById(
  supabase: SupabaseClient,
  orderId: string
): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) return null;
  return data as Order | null;
}

export async function getOrders(
  supabase: SupabaseClient,
  userId: string,
  limit = 50
): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Order[];
}

/** Count orders linked to a user (for account/store linkage visibility). */
export async function getOrderCountForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) return 0;
  return count ?? 0;
}

export function formatOrderNumber(order: Order): string {
  return (
    order.order_number ??
    order.external_id ??
    order.id.slice(0, 8).toUpperCase()
  );
}

export function formatOrderTotal(
  totalCents: number | null,
  currency: string | null
): string {
  if (totalCents == null) return "—";
  const currencyCode = currency ?? "USD";
  const symbol = currencyCode === "USD" ? "$" : currencyCode + " ";
  const amount = (totalCents / 100).toFixed(2);
  return `${symbol}${amount}`;
}
