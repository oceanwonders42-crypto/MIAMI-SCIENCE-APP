import type { SupabaseClient } from "@supabase/supabase-js";
import type { Shipment } from "@/types";
import type { Order } from "@/types";
import { isDelivered } from "./shipments";

export interface ShipmentPrefill {
  name: string;
  current_count: number;
  unit: string;
}

/**
 * Derive safe prefill for a new supply from shipment + order.
 * Uses order metadata items if present, else order_number / item_count.
 */
export function getShipmentPrefill(
  shipment: Shipment,
  order: Order
): ShipmentPrefill {
  const meta = order.metadata as Record<string, unknown> | null | undefined;
  const items = Array.isArray(meta?.items) ? meta.items : [];
  const first = items[0] as { name?: string; quantity?: number; unit?: string } | undefined;
  const name =
    (typeof first?.name === "string" && first.name.trim()) ||
    (order.order_number ? `Order ${order.order_number}` : "My order");
  const count =
    typeof first?.quantity === "number" && first.quantity > 0
      ? first.quantity
      : (order.item_count != null && order.item_count > 0 ? order.item_count : 1);
  const unit =
    (typeof first?.unit === "string" && first.unit.trim()) ||
    "units";
  return {
    name: name.trim() || "My order",
    current_count: Math.min(Math.floor(count), 99999),
    unit: unit || "units",
  };
}

export function isInventoryUpdated(shipment: Shipment): boolean {
  return shipment.inventory_updated_at != null;
}

/**
 * Mark a shipment as inventory-updated (user added/updated supply from this delivery).
 */
export async function markShipmentInventoryUpdated(
  supabase: SupabaseClient,
  shipmentId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("shipments")
    .update({
      inventory_updated_at: new Date().toISOString(),
      inventory_updated_by: userId,
    })
    .eq("id", shipmentId);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

/**
 * Delivered shipments for the user that are not yet marked as inventory-updated.
 */
export async function getDeliveredShipmentsNotUpdated(
  supabase: SupabaseClient,
  userId: string
): Promise<Shipment[]> {
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", userId);
  if (!orders?.length) return [];
  const orderIds = orders.map((o) => o.id);
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .in("order_id", orderIds)
    .is("inventory_updated_at", null)
    .order("delivered_at", { ascending: false })
    .limit(20);
  if (error) return [];
  const list = (data ?? []) as Shipment[];
  return list.filter((s) => isDelivered(s));
}
