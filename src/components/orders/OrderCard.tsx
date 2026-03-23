import type { Order } from "@/types";
import type { Shipment } from "@/types";
import { formatOrderNumber, formatOrderTotal } from "@/lib/orders";
import {
  deriveOrderUiStatus,
  orderStatusBadgeClass,
  orderStatusLabel,
} from "@/lib/order-status-ui";
import { formatShipmentStatusLabel, isDelivered } from "@/lib/shipments";
import { getCarrierTrackingUrl } from "@/lib/tracking-url";
import type { EnrichedOrderLineItem } from "@/lib/order-line-items";
import { Card, CardContent } from "@/components/ui/Card";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { ShipmentBlock } from "./ShipmentBlock";
import { SHOP_REFILL_URL } from "@/lib/constants";

interface OrderCardProps {
  order: Order;
  shipments: Shipment[];
  lineItems: EnrichedOrderLineItem[];
  shopUrl?: string | null;
  /** Larger padding / timeline for “currently shipping” strip */
  variant?: "default" | "highlight";
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEstDelivery(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function OrderCard({
  order,
  shipments,
  lineItems,
  shopUrl,
  variant = "default",
}: OrderCardProps) {
  const orderLabel = formatOrderNumber(order);
  const totalFormatted = formatOrderTotal(order.total_cents, order.currency);
  const buyAgainUrl = order.shop_url ?? shopUrl ?? SHOP_REFILL_URL;
  const uiStatus = deriveOrderUiStatus(order, shipments);
  const badgeClass = orderStatusBadgeClass(uiStatus);
  const badgeLabel = orderStatusLabel(uiStatus);

  const primaryShipment = shipments[0];
  const hasTracking = shipments.some((s) => s.tracking_number?.trim());

  return (
    <Card
      id={`order-${order.id}`}
      className={
        variant === "highlight"
          ? "border-sky-500/30 bg-gradient-to-b from-sky-950/20 to-transparent"
          : undefined
      }
    >
      <CardContent className={variant === "highlight" ? "py-5 space-y-4" : "py-4 space-y-4"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-100 tracking-tight">Order {orderLabel}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{formatShortDate(order.created_at)}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span className="text-lg font-semibold text-zinc-100 tabular-nums">{totalFormatted}</span>
          {order.item_count != null && order.item_count > 0 && (
            <span className="text-zinc-500">
              {order.item_count} item{order.item_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {primaryShipment && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm border border-zinc-800/80 rounded-lg px-3 py-2 bg-zinc-950/50">
            <span className="text-sky-300/95 font-medium">
              {formatShipmentStatusLabel(primaryShipment.status)}
            </span>
            {primaryShipment.carrier && (
              <span className="text-zinc-500">· {primaryShipment.carrier}</span>
            )}
            {primaryShipment.estimated_delivery &&
              !primaryShipment.delivered_at &&
              primaryShipment.status.toLowerCase() !== "delivered" && (
                <span className="text-zinc-400">
                  Est. {formatEstDelivery(primaryShipment.estimated_delivery)}
                </span>
              )}
          </div>
        )}

        <OrderStatusTimeline order={order} shipments={shipments} />

        {hasTracking && (
          <div className="flex flex-wrap gap-2">
            {shipments.map((s) => {
              const url = getCarrierTrackingUrl(s.carrier, s.tracking_number);
              if (!url) return null;
              return (
                <a
                  key={s.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-3 py-2 text-sm transition-colors"
                >
                  Track order
                  {shipments.length > 1 ? ` (${s.tracking_number?.slice(-4) ?? "…"})` : ""}
                </a>
              );
            })}
          </div>
        )}

        <details className="group rounded-lg border border-zinc-800 bg-zinc-950/40 open:border-zinc-700">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 flex items-center justify-between gap-2">
            <span>Line items</span>
            <span className="text-zinc-500 group-open:rotate-180 transition-transform text-xs">▼</span>
          </summary>
          <div className="border-t border-zinc-800/80 px-3 py-3 space-y-3">
            {lineItems.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Detailed line items appear after your order syncs from the store. Totals and status
                above stay up to date.
              </p>
            ) : (
              <ul className="space-y-3">
                {lineItems.map((item, idx) => (
                  <li key={`${item.product_id ?? "x"}-${idx}`} className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote Woo images
                        <img
                          src={item.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-600 px-1 text-center">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-100 leading-snug">
                        {item.catalog_name ?? item.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Qty {item.quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>

        {shipments.some((s) => isDelivered(s)) && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">After delivery</p>
            {shipments.filter((s) => isDelivered(s)).map((s) => (
              <ShipmentBlock key={s.id} shipment={s} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={buyAgainUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold px-3 py-1.5 text-sm transition-colors"
          >
            Buy again
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
