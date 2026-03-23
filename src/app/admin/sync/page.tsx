import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { ShipStationSyncButton } from "./ShipStationSyncButton";
import { SquareStatusLookup } from "./SquareStatusLookup";

export default function AdminSyncPage() {
  return (
    <>
      <Header title="Sync & status" subtitle="ShipStation shipment sync and Square lookup" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="ShipStation shipment sync">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Run shipment sync</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Fetches shipments from ShipStation, links to app orders by order number, and upserts
                into the shipments table. Idempotent by external_id. Existing shipment views will
                show synced carrier, tracking, and delivery status.
              </p>
            </CardHeader>
            <CardContent>
              <ShipStationSyncButton />
            </CardContent>
          </Card>
        </Section>
        <Section title="Square invoice & order status">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Look up by ID</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Fetch invoice or order status from Square by ID. Results are normalized; no secrets
                displayed. Use for payment/invoice visibility and diagnostics.
              </p>
            </CardHeader>
            <CardContent>
              <SquareStatusLookup />
            </CardContent>
          </Card>
        </Section>
        <p className="text-sm">
          <Link href={ROUTES.admin} className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to admin
          </Link>
        </p>
      </div>
    </>
  );
}
