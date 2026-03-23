import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getProductSyncToolMeta } from "@/lib/admin/tool-meta";
import { ProductSyncButton } from "./ProductSyncButton";

export default async function AdminProductSyncPage() {
  const service = createServiceRoleClient();
  const meta = await getProductSyncToolMeta(service);

  return (
    <>
      <Header title="Product sync" subtitle="WooCommerce → catalog" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Status">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="py-4 text-sm">
                <p className="text-zinc-500 dark:text-zinc-400">Products in catalog</p>
                <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {meta.productCount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-sm">
                <p className="text-zinc-500 dark:text-zinc-400">Last sync</p>
                <p className="text-zinc-900 dark:text-zinc-100">
                  {meta.lastRunAt
                    ? new Date(meta.lastRunAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "Never"}
                </p>
                {meta.summary && typeof meta.summary.fetched === "number" && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Last run: fetched {meta.summary.fetched}, +{String(meta.summary.productsInserted ?? 0)} / ~
                    {String(meta.summary.productsUpdated ?? 0)} updated
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </Section>
        <Section title="Sync products">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Run product sync</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Fetches products from the WooCommerce API, normalizes them, and upserts into the app&apos;s
                products and product_links tables. Idempotent; safe to run multiple times. Catalog and
                favorites will use synced products automatically.
              </p>
            </CardHeader>
            <CardContent>
              <ProductSyncButton />
            </CardContent>
          </Card>
        </Section>
        <Section title="Config">
          <Card>
            <CardContent className="py-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>
                Requires: <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-1">WOOCOMMERCE_URL</code>,{" "}
                <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-1">WOOCOMMERCE_CONSUMER_KEY</code>,{" "}
                <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-1">WOOCOMMERCE_CONSUMER_SECRET</code>.
              </p>
              <p className="text-zinc-500 dark:text-zinc-500">
                See docs/PRODUCT_SYNC.md for field mapping and how to run sync.
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
