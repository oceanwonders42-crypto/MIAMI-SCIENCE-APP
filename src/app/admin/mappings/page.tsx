import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getMappingToolMeta } from "@/lib/admin/tool-meta";
import { MappingLookupForm } from "./MappingLookupForm";
import { UpsertMappingForm } from "./UpsertMappingForm";
import { OrderDiagnosticsCard } from "./OrderDiagnosticsCard";
import { UnmatchedOrdersSection } from "./UnmatchedOrdersSection";

export default async function AdminMappingsPage() {
  const service = createServiceRoleClient();
  const mapMeta = await getMappingToolMeta(service);

  return (
    <>
      <Header title="Customer mappings" subtitle="Inspect and manage store–app linkage" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Overview">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="py-4 text-sm">
                <p className="text-zinc-500 dark:text-zinc-400">Customer mappings (matched)</p>
                <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {mapMeta.mappingsCount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-sm">
                <p className="text-zinc-500 dark:text-zinc-400">Orders with no linked user</p>
                <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {mapMeta.unmatchedOrders.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>
        <Section title="Order linkage diagnostics">
          <Card>
            <CardContent className="py-4">
              <OrderDiagnosticsCard />
            </CardContent>
          </Card>
        </Section>
        <Section title="Inspect mapping">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Look up by user ID, WooCommerce customer ID, or email</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Find an existing customer mapping. Safe read-only lookup.
              </p>
            </CardHeader>
            <CardContent>
              <MappingLookupForm />
            </CardContent>
          </Card>
        </Section>
        <Section title="Create or update mapping">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual mapping</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Link an app user to a WooCommerce customer. Use manual match source for admin-created links.
                One mapping per user; submitting updates the existing mapping for that user.
              </p>
            </CardHeader>
            <CardContent>
              <UpsertMappingForm />
            </CardContent>
          </Card>
        </Section>
        <Section title="Unmatched orders (email-link review)">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders with no linked user</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Surface candidates by email for admin review. Do not auto-link; create mapping manually if correct.
              </p>
            </CardHeader>
            <CardContent>
              <UnmatchedOrdersSection />
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
