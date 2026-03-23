import { Badge } from "@/components/ui/Badge";
import {
  getShipmentStatusDisplay,
  type ShipmentStatusDisplay,
} from "@/lib/shipments";
import { cn } from "@/lib/utils";

const LABELS: Record<ShipmentStatusDisplay, string> = {
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Update pending",
};

const VARIANT: Record<ShipmentStatusDisplay, "default" | "success" | "warning" | "error" | "outline"> = {
  processing: "default",
  shipped: "outline",
  out_for_delivery: "warning",
  delivered: "success",
  exception: "error",
};

interface ShipmentStatusBadgeProps {
  status: string;
  className?: string;
}

export function ShipmentStatusBadge({ status, className }: ShipmentStatusBadgeProps) {
  const display = getShipmentStatusDisplay(status);
  return (
    <Badge variant={VARIANT[display]} className={cn(className)}>
      {LABELS[display]}
    </Badge>
  );
}
