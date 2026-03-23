import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getOrders } from "@/lib/orders";
import { getShipmentsForOrder } from "@/lib/shipments";
import { getSupplies } from "@/lib/supplies";
import { getRefillSummary } from "@/lib/refill-timing";
import { computePurchaseStats } from "@/lib/purchase-stats";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { OrderCard } from "@/components/orders/OrderCard";
import { PurchaseStatsBlock } from "@/components/orders/PurchaseStatsBlock";
import { SeedDemoButton } from "./SeedDemoButton";
import { ConnectStoreCta } from "./ConnectStoreCta";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { SHOP_REFILL_URL } from "@/lib/constants";
import { ROUTES } from "@/lib/constants";
import { getCustomerMappingByUserId } from "@/lib/customer-mapping";
import {
  enrichOrderLineItemsWithProducts,
  parseOrderLineItems,
} from "@/lib/order-line-items";
import { orderHasInTransitShipment } from "@/lib/order-status-ui";

export default async function OrdersPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [orders, supplies, customerMapping] = await Promise.all([
    getOrders(supabase, userId),
    getSupplies(supabase, userId),
    getCustomerMappingByUserId(supabase, userId),
  ]);
  const refillSummary = getRefillSummary(supplies);
  const needRefill =
    refillSummary.lowCount > 0 ||
    refillSummary.criticalCount > 0 ||
    refillSummary.reorderSoonCount > 0;

  const ordersWithShipments = await Promise.all(
    orders.map(async (order) => {
      const shipments = await getShipmentsForOrder(supabase, order.id);
      return { order, shipments };
    })
  );

  const itemsByOrder = orders.map((order) => ({
    orderId: order.id,
    items: parseOrderLineItems(order),
  }));
  const flatItems = itemsByOrder.flatMap((r) => r.items);
  const enrichedFlat = await enrichOrderLineItemsWithProducts(supabase, flatItems);
  let offset = 0;
  const enrichedByOrderId = new Map<string, Awaited<ReturnType<typeof enrichOrderLineItemsWithProducts>>>();
  for (const row of itemsByOrder) {
    const n = row.items.length;
    enrichedByOrderId.set(row.orderId, enrichedFlat.slice(offset, offset + n));
    offset += n;
  }

  const purchaseStats = computePurchaseStats(orders);

  const inTransit = ordersWithShipments.filter(({ shipments }) =>
    orderHasInTransitShipment(shipments)
  );

  return (
    <>
      <Header title="Orders" subtitle="Order history & shipment tracking" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        {!customerMapping && (
          <Section title="Store account">
            <ConnectStoreCta />
          </Section>
        )}

        {needRefill && (
          <Section title="Refill">
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  {refillSummary.criticalCount > 0 || refillSummary.lowCount > 0
                    ? `${refillSummary.lowCount + refillSummary.criticalCount} item(s) need attention.`
                    : `${refillSummary.reorderSoonCount} item(s) running low soon.`}{" "}
                  Update your stack or reorder.
                </p>
                <Link
                  href={ROUTES.stack}
                  className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3 text-sm"
                >
                  View Stack
                </Link>
              </CardContent>
            </Card>
          </Section>
        )}

        {inTransit.length > 0 && (
          <Section title="Currently shipping">
            <ul className="space-y-4">
              {inTransit.map(({ order, shipments }) => (
                <li key={order.id}>
                  <OrderCard
                    order={order}
                    shipments={shipments}
                    lineItems={enrichedByOrderId.get(order.id) ?? []}
                    shopUrl={SHOP_REFILL_URL}
                    variant="highlight"
                  />
                </li>
              ))}
            </ul>
          </Section>
        )}

        {orders.length > 0 && (
          <Section title="Purchase stats">
            <PurchaseStatsBlock stats={purchaseStats} shopUrl={SHOP_REFILL_URL} />
          </Section>
        )}

        <Section title="Order history">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center space-y-4">
                <p className="text-sm text-zinc-400">
                  You don’t have any orders yet. When you place an order with Miami Science, it will
                  show up here with status and shipment details.
                </p>
                <a
                  href={SHOP_REFILL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm"
                >
                  Shop now
                </a>
                <SeedDemoButton />
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-4">
              {ordersWithShipments.map(({ order, shipments }) => (
                <li key={order.id}>
                  <OrderCard
                    order={order}
                    shipments={shipments}
                    lineItems={enrichedByOrderId.get(order.id) ?? []}
                    shopUrl={SHOP_REFILL_URL}
                    variant="default"
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Shop / Reorder">
          <Card>
            <CardContent className="py-4 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Reorder from Miami Science</span>
              <a
                href={SHOP_REFILL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 text-sm"
              >
                Shop refill
              </a>
            </CardContent>
          </Card>
        </Section>
        <Disclaimer compact className="text-center" />
      </div>
    </>
  );
}
