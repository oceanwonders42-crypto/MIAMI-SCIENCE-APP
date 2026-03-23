import Link from "next/link";
import type { CustomerMapping } from "@/types";
import { formatOrderTotal } from "@/lib/orders";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/lib/constants";

const MATCH_SOURCE_LABELS: Record<string, string> = {
  auto_email: "Auto (email)",
  email: "Matched by email",
  imported: "Imported from store",
  manual: "Manually linked",
  woo_customer_id: "Linked by store customer ID",
};

function getMatchSourceLabel(source: string): string {
  return MATCH_SOURCE_LABELS[source] ?? source;
}

export interface CompactPurchaseStats {
  totalOrders: number;
  totalSpentCents: number | null;
  daysSinceLastOrder: number | null;
}

interface StoreAccountCardProps {
  storeMapping: CustomerMapping | null;
  orderCount: number;
  compactStats?: CompactPurchaseStats | null;
}

export function StoreAccountCard({ storeMapping, orderCount, compactStats }: StoreAccountCardProps) {
  const totalFormatted =
    compactStats?.totalSpentCents != null
      ? formatOrderTotal(compactStats.totalSpentCents, "USD")
      : null;
  const daysLabel =
    compactStats?.daysSinceLastOrder != null
      ? compactStats.daysSinceLastOrder === 0
        ? "Last order today"
        : `${compactStats.daysSinceLastOrder} days since last order`
      : null;

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">
            Store account
          </span>
          {storeMapping ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              Linked
            </Badge>
          ) : (
            <Badge variant="outline" className="text-zinc-500 dark:text-zinc-400">
              Not linked
            </Badge>
          )}
        </div>
        {storeMapping ? (
          <>
            <p className="text-sm text-zinc-400">
              Your order history from the store is shown on the Orders page.
            </p>
            {compactStats && compactStats.totalOrders > 0 && (
              <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 px-3 py-2 text-sm">
                <p className="text-zinc-300">
                  {compactStats.totalOrders} order{compactStats.totalOrders !== 1 ? "s" : ""}
                  {totalFormatted != null ? ` · ${totalFormatted} total` : ""}
                  {daysLabel != null ? ` · ${daysLabel}` : ""}
                </p>
                <Link
                  href={ROUTES.orders}
                  className="mt-1.5 inline-block text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  View store history →
                </Link>
              </div>
            )}
            <dl className="grid grid-cols-1 gap-1 text-sm">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400 inline">Match: </dt>
                <dd className="inline text-zinc-300">
                  {getMatchSourceLabel(storeMapping.match_source)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400 inline">Store customer ID: </dt>
                <dd className="inline text-zinc-300 font-mono text-xs">
                  {storeMapping.woo_customer_id}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400 inline">Order history: </dt>
                <dd className="inline text-zinc-300">
                  {orderCount > 0
                    ? `${orderCount} order${orderCount !== 1 ? "s" : ""} available`
                    : "No orders yet"}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-zinc-400">
            Not linked to a store customer. Orders placed while signed in or linked later will appear on the Orders page.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
