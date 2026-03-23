import type { SupabaseClient } from "@supabase/supabase-js";
import type { Shipment } from "@/types";

export type ShipmentStatusDisplay =
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "exception";

const STATUS_MAP: Record<string, ShipmentStatusDisplay> = {
  processing: "processing",
  pending: "processing",
  shipped: "shipped",
  in_transit: "shipped",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  exception: "exception",
  unknown: "exception",
};

export function getShipmentStatusDisplay(status: string): ShipmentStatusDisplay {
  const normalized = (status ?? "").toLowerCase().replace(/\s+/g, "_");
  return STATUS_MAP[normalized] ?? "exception";
}

export function isDelivered(shipment: Shipment): boolean {
  return getShipmentStatusDisplay(shipment.status) === "delivered";
}

export function formatShipmentStatusLabel(status: string): string {
  const d = getShipmentStatusDisplay(status);
  switch (d) {
    case "processing":
      return "Processing";
    case "shipped":
      return "In transit";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "exception":
      return "Issue";
    default:
      return "Processing";
  }
}

export async function getShipmentById(
  supabase: SupabaseClient,
  shipmentId: string
): Promise<Shipment | null> {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", shipmentId)
    .maybeSingle();
  if (error) return null;
  return data as Shipment | null;
}

export async function getShipmentsForOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<Shipment[]> {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Shipment[];
}

/**
 * All shipments for a user's orders (for dashboard summary).
 */
export async function getShipmentsForUser(
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
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return [];
  return (data ?? []) as Shipment[];
}
