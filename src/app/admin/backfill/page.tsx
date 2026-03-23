import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getBackfillToolMeta } from "@/lib/admin/tool-meta";
import { BackfillRunButton } from "./BackfillRunButton";

export default async function AdminBackfillPage() {
  const service = createServiceRoleClient();
  const meta = await getBackfillToolMeta(service);
  const s = meta.summary;

  return (
    <>
      <Header title="WooCommerce backfill" subtitle="Customer & order import" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Last run">
          <Card>
            <CardContent className="py-4 text-sm space-y-2">
              <p>
                <span className="text-zinc-500 dark:text-zinc-400">Last import:</span>{" "}
                {meta.lastRunAt
                  ? new Date(meta.lastRunAt).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "Never"}
              </p>
              {s && typeof s.ordersUpserted === "number" && (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-600 dark:text-zinc-400 text-xs">
                  <li>Orders upserted: {String(s.ordersUpserted)}</li>
                  <li>Orders matched: {String(s.ordersMatched ?? "—")}</li>
                  <li>Orders unmatched: {String(s.ordersUnmatched ?? "—")}</li>
                  <li>Mappings created: {String(s.mappingsCreated ?? "—")}</li>
                </ul>
              )}
            </CardContent>
          </Card>
        </Section>
        <Section title="Historical import">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Run backfill</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Fetches WooCommerce customers and orders via API, creates customer mappings by
                exact email match with app users, and upserts orders. Unmatched orders are stored
                with user_id null (not shown to any user). Idempotent; safe to run multiple times.
              </p>
            </CardHeader>
            <CardContent>
              <BackfillRunButton />
            </CardContent>
          </Card>
        </Section>
        <Section title="Matching rules">
          <Card>
            <CardContent className="py-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>
                <strong>Customer mapping:</strong> WooCommerce customer email (normalized) must match
                exactly one app user email (from Auth). No match by name. One mapping per user and
                per WooCommerce customer.
              </p>
              <p>
                <strong>Order linking:</strong> Each order is linked to the app user whose
                customer_mapping has the order’s WooCommerce customer_id. If no mapping exists,
                order is stored with user_id null.
              </p>
              <p className="text-zinc-500 dark:text-zinc-500">
                Requires: WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET,
                and SUPABASE_SERVICE_ROLE_KEY.
              </p>
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
