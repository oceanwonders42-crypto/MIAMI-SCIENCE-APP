import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";
import { formatOrderNumber, formatOrderTotal } from "@/lib/orders";
import { getShipmentStatusDisplay } from "@/lib/shipments";
import type { Order } from "@/types";
import type { Shipment } from "@/types";

interface OrdersOverviewBlockProps {
  orders: Order[];
  shipments: Shipment[];
  deliveredNotAddedCount: number;
  /** `peek` = compact list for redesigned home */
  variant?: "full" | "peek";
}

export function OrdersOverviewBlock({
  orders,
  shipments,
  deliveredNotAddedCount,
  variant = "full",
}: OrdersOverviewBlockProps) {
  const latestOrder = orders[0] ?? null;
  const inProgress = shipments.filter(
    (s) => getShipmentStatusDisplay(s.status) !== "delivered"
  );

  if (orders.length === 0) {
    return (
      <Card
        className={
          variant === "peek" ? "border-white/[0.07] bg-zinc-900/35" : "border-zinc-800 bg-zinc-900/50"
        }
      >
        <CardContent className="py-5 text-center">
          <p className="text-sm text-zinc-400 mb-3">No orders yet.</p>
          <Link
            href={ROUTES.orders}
            className="inline-block text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            Orders →
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (variant === "peek") {
    const peek = orders.slice(0, 2);
    return (
      <section aria-label="Recent orders" className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Recent orders
          </p>
          <Link
            href={ROUTES.orders}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-300"
          >
            See all
          </Link>
        </div>
        <Card className="border-white/[0.07] bg-zinc-900/35">
          <CardContent className="p-0 divide-y divide-white/[0.05]">
            {peek.map((o) => (
              <Link
                key={o.id}
                href={ROUTES.orders}
                className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {formatOrderNumber(o)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(o.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {formatOrderTotal(o.total_cents, o.currency)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium capitalize text-zinc-400">{o.status}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        {inProgress.length > 0 && (
          <p className="text-xs text-center text-zinc-500">
            {inProgress.length} shipment{inProgress.length !== 1 ? "s" : ""} on the way
          </p>
        )}
        {deliveredNotAddedCount > 0 && (
          <p className="text-center text-xs font-medium text-amber-400/90">
            {deliveredNotAddedCount} delivered — add to stack
          </p>
        )}
      </section>
    );
  }

  const latestLine = latestOrder
    ? `${formatOrderNumber(latestOrder)} · ${new Date(latestOrder.created_at).toLocaleDateString()} · ${formatOrderTotal(latestOrder.total_cents, latestOrder.currency)} · ${latestOrder.status}`
    : null;

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-4 space-y-2">
        {latestLine && (
          <p className="text-sm text-zinc-300 break-words">
            {latestLine}
          </p>
        )}
        {inProgress.length > 0 && (
          <p className="text-sm text-zinc-400">
            {inProgress.length} shipment{inProgress.length !== 1 ? "s" : ""} in progress
          </p>
        )}
        {deliveredNotAddedCount > 0 && (
          <p className="text-sm font-medium text-primary-500 dark:text-primary-400">
            {deliveredNotAddedCount} delivered — add to stack
          </p>
        )}
        <Link
          href={ROUTES.orders}
          className="inline-block pt-1 text-sm font-medium text-primary-500 dark:text-primary-400 hover:underline"
        >
          Orders →
        </Link>
      </CardContent>
    </Card>
  );
}
