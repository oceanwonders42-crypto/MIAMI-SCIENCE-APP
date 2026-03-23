import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getIntegrationStatusesWithCallable } from "@/lib/integrations/integration-diagnostics";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";

type SyncLogRow = {
  integration: string;
  last_run_at: string;
  summary: Record<string, unknown>;
};

async function getLastSyncLog(): Promise<SyncLogRow | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("integration_sync_log")
      .select("integration, last_run_at, summary")
      .eq("integration", "shipstation_shipments")
      .maybeSingle();
    if (error || !data) return null;
    return data as SyncLogRow;
  } catch {
    return null;
  }
}

export default async function AdminIntegrationsPage() {
  const [statuses, lastSync] = await Promise.all([
    getIntegrationStatusesWithCallable(),
    getLastSyncLog(),
  ]);

  return (
    <>
      <Header title="Integrations" subtitle="External API diagnostics" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Status">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Configured = required env vars set. Callable = minimal API request succeeded. No secrets are displayed.
          </p>
          <div className="space-y-3">
            {statuses.map((s) => (
              <Card key={s.name}>
                <CardHeader>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-4">
                    <span>
                      <span className="text-zinc-500 dark:text-zinc-400">Configured:</span>{" "}
                      {s.configured ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">No</span>
                      )}
                    </span>
                    <span>
                      <span className="text-zinc-500 dark:text-zinc-400">Callable:</span>{" "}
                      {s.callable ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                      ) : s.configured ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          No{s.callableError ? ` — ${s.callableError}` : ""}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </span>
                  </div>
                  {s.name === "WooCommerce" && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Env: WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET
                    </p>
                  )}
                  {s.name === "ShipStation" && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Env: SHIPSTATION_API_KEY (optional: SHIPSTATION_BASE_URL)
                    </p>
                  )}
                  {s.name === "Square" && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Env: SQUARE_ACCESS_TOKEN, SQUARE_ENVIRONMENT (optional: SQUARE_LOCATION_ID)
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
        <Section title="Recent sync">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Last ShipStation shipment sync result (no secrets). Run sync from Sync &amp; status.
          </p>
          {lastSync ? (
            <Card>
              <CardContent className="py-4 text-sm space-y-2">
                <p className="text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-500 dark:text-zinc-400">ShipStation shipments:</span>{" "}
                  last run{" "}
                  {new Date(lastSync.last_run_at).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
                {typeof lastSync.summary === "object" && lastSync.summary !== null && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-600 dark:text-zinc-400">
                    {"fetched" in lastSync.summary && (
                      <li>Fetched: {String(lastSync.summary.fetched)}</li>
                    )}
                    {"updated" in lastSync.summary && (
                      <li>Updated: {String(lastSync.summary.updated)}</li>
                    )}
                    {"inserted" in lastSync.summary && (
                      <li>Inserted: {String(lastSync.summary.inserted)}</li>
                    )}
                    {"errorCount" in lastSync.summary && Number(lastSync.summary.errorCount) > 0 && (
                      <li className="text-amber-600 dark:text-amber-400">
                        Errors: {String(lastSync.summary.errorCount)}
                      </li>
                    )}
                  </ul>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-500 pt-1">
                  <Link href="/admin/sync" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Run sync →
                  </Link>
                </p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              No sync run yet. Run ShipStation shipment sync from{" "}
              <Link href="/admin/sync" className="text-primary-600 dark:text-primary-400 hover:underline">
                Sync &amp; status
              </Link>
              .
            </p>
          )}
        </Section>
        <Section title="Quick links">
          <ul className="flex flex-wrap gap-3 text-sm">
            <li>
              <Link href="/admin/sync" className="text-primary-600 dark:text-primary-400 hover:underline">
                Sync & status
              </Link>
            </li>
            <li>
              <Link href="/admin/mappings" className="text-primary-600 dark:text-primary-400 hover:underline">
                Customer mappings
              </Link>
            </li>
            <li>
              <Link href="/admin/backfill" className="text-primary-600 dark:text-primary-400 hover:underline">
                WooCommerce backfill
              </Link>
            </li>
            <li>
              <Link href="/admin/product-sync" className="text-primary-600 dark:text-primary-400 hover:underline">
                Product sync
              </Link>
            </li>
            <li>
              <Link href="/admin/notifications" className="text-primary-600 dark:text-primary-400 hover:underline">
                Notification test
              </Link>
            </li>
          </ul>
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
