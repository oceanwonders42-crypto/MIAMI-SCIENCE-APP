import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getShipmentById } from "@/lib/shipments";
import { getOrderById } from "@/lib/orders";
import { getSupplies } from "@/lib/supplies";
import { isDelivered } from "@/lib/shipments";
import {
  getShipmentPrefill,
  isInventoryUpdated,
} from "@/lib/shipment-inventory";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { AddSupplyFromShipmentForm } from "../../AddSupplyFromShipmentForm";
import { UpdateSupplyFromShipmentForm } from "../../UpdateSupplyFromShipmentForm";
import { ROUTES } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/orders";

interface PageProps {
  params: Promise<{ shipmentId: string }>;
}

export default async function AddToStackPage({ params }: PageProps) {
  const { shipmentId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [shipment, supplies] = await Promise.all([
    getShipmentById(supabase, shipmentId),
    getSupplies(supabase, userId),
  ]);

  if (!shipment) {
    redirect(ROUTES.orders);
  }

  const order = await getOrderById(supabase, shipment.order_id);
  if (!order || order.user_id !== userId) {
    redirect(ROUTES.orders);
  }

  if (!isDelivered(shipment)) {
    redirect(ROUTES.orders);
  }

  if (isInventoryUpdated(shipment)) {
    redirect(`${ROUTES.stack}?inventoryUpdated=1`);
  }

  const prefill = getShipmentPrefill(shipment, order);
  const orderLabel = formatOrderNumber(order);

  return (
    <>
      <Header
        title="Add to stack"
        subtitle={`From order ${orderLabel}`}
      />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <p className="text-sm text-zinc-400">
          This delivery is marked delivered. Add items to your supply stack or update an existing item so your refill timing stays accurate.
        </p>

        <Section title="Add new supply item">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New item</CardTitle>
              <p className="text-sm text-zinc-400">
                Prefilled from your order. Edit as needed.
              </p>
            </CardHeader>
            <CardContent>
              <AddSupplyFromShipmentForm
                shipmentId={shipmentId}
                prefill={prefill}
              />
            </CardContent>
          </Card>
        </Section>

        <Section title="Update existing supply">
          {supplies.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-zinc-400">
                You don’t have any supply items yet. Add one above.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-zinc-400 mb-3">
                  Add the quantity you received to an existing item.
                </p>
                <UpdateSupplyFromShipmentForm
                  shipmentId={shipmentId}
                  supplies={supplies}
                />
              </CardContent>
            </Card>
          )}
        </Section>

        <p>
          <Link
            href={ROUTES.orders}
            className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
          >
            ← Back to orders
          </Link>
        </p>
      </div>
    </>
  );
}
