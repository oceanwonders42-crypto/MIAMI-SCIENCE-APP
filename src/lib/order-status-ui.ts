import type { Order } from "@/types";
import type { Shipment } from "@/types";
import { getShipmentStatusDisplay, isDelivered } from "@/lib/shipments";

export type OrderUiStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export function deriveOrderUiStatus(order: Order, shipments: Shipment[]): OrderUiStatus {
  const os = (order.status ?? "").toLowerCase();
  if (os.includes("cancel") || os.includes("refund")) return "cancelled";

  if (shipments.length > 0) {
    const allDelivered = shipments.every((s) => isDelivered(s));
    const anyDelivered = shipments.some((s) => isDelivered(s));
    const anyMoving = shipments.some((s) => isShipmentInTransit(s));

    if (allDelivered) return "delivered";
    if (anyMoving) return "shipped";
    if (anyDelivered) return "shipped";
  } else {
    if (os === "completed") return "delivered";
    if (os === "pending" || os === "on-hold") return "pending";
    if (os.includes("process") || os === "processing") return "processing";
  }

  if (os === "pending" || os === "on-hold" || os === "failed") return "pending";
  if (os.includes("process")) return "processing";
  if (os.includes("ship")) return "shipped";
  if (os === "completed") return "delivered";

  return "processing";
}

/** Shipment is on the way (not delivered, not failed exception). */
export function isShipmentInTransit(shipment: Shipment): boolean {
  if (isDelivered(shipment)) return false;
  const d = getShipmentStatusDisplay(shipment.status);
  if (d === "exception") return false;
  return d === "shipped" || d === "out_for_delivery" || d === "processing";
}

export function orderHasInTransitShipment(shipments: Shipment[]): boolean {
  return shipments.some((s) => isShipmentInTransit(s));
}

export function orderStatusBadgeClass(status: OrderUiStatus): string {
  switch (status) {
    case "pending":
      return "bg-zinc-700/90 text-zinc-100 border-zinc-500/40";
    case "processing":
      return "bg-sky-600/30 text-sky-100 border-sky-500/45";
    case "shipped":
      return "bg-amber-500/20 text-amber-100 border-amber-500/40";
    case "delivered":
      return "bg-emerald-600/30 text-emerald-100 border-emerald-500/45";
    case "cancelled":
      return "bg-red-950/60 text-red-200 border-red-800/50";
    default:
      return "bg-zinc-800 text-zinc-200 border-zinc-600";
  }
}

export function orderStatusLabel(status: OrderUiStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return "Processing";
  }
}

export type TimelineStep = "placed" | "processing" | "shipped" | "delivered";

export function computeTimelineStep(order: Order, shipments: Shipment[]): TimelineStep {
  const ui = deriveOrderUiStatus(order, shipments);
  if (ui === "cancelled") return "placed";
  if (ui === "delivered") return "delivered";
  if (ui === "shipped") return "shipped";
  if (ui === "pending") return "placed";
  return "processing";
}
