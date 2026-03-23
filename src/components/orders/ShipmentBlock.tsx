import Link from "next/link";
import type { Shipment } from "@/types";
import { getShipmentStatusDisplay, isDelivered } from "@/lib/shipments";
import { isInventoryUpdated } from "@/lib/shipment-inventory";
import { ShipmentStatusBadge } from "./ShipmentStatusBadge";
import { Card, CardContent } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";

interface ShipmentBlockProps {
  shipment: Shipment;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ShipmentBlock({ shipment }: ShipmentBlockProps) {
  const delivered = isDelivered(shipment);
  const display = getShipmentStatusDisplay(shipment.status);

  return (
    <Card className="border-zinc-800">
      <CardContent className="py-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ShipmentStatusBadge status={shipment.status} />
          {shipment.carrier && (
            <span className="text-sm text-zinc-400">
              {shipment.carrier}
            </span>
          )}
        </div>
        {shipment.tracking_number && (
          <p className="text-sm">
            <span className="text-zinc-500">Tracking: </span>
            <code className="text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded">
              {shipment.tracking_number}
            </code>
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-400">
          {shipment.shipped_at && (
            <>
              <span>Shipped</span>
              <span>{formatDate(shipment.shipped_at)}</span>
            </>
          )}
          {shipment.estimated_delivery && display !== "delivered" && (
            <>
              <span>Est. delivery</span>
              <span>{formatDate(shipment.estimated_delivery)}</span>
            </>
          )}
          {shipment.delivered_at && (
            <>
              <span>Delivered</span>
              <span>{formatDate(shipment.delivered_at)}</span>
            </>
          )}
        </div>
        {delivered && (
          <div className="flex flex-wrap gap-2 mt-2">
            {isInventoryUpdated(shipment) ? (
              <span className="text-sm font-medium text-emerald-400">
                Inventory updated
              </span>
            ) : (
              <>
                <Link
                  href={ROUTES.orderShipmentAddToStack(shipment.id)}
                  className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3 text-sm"
                >
                  Add to stack
                </Link>
                <Link
                  href={ROUTES.stack}
                  className="rounded-lg border border-zinc-700 py-2 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Update supply →
                </Link>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
