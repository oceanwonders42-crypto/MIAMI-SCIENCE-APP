import type { Order } from "@/types";
import type { PurchaseStats } from "@/lib/purchase-stats";
import { formatOrderNumber, formatOrderTotal } from "@/lib/orders";
import { Card, CardContent } from "@/components/ui/Card";

interface PurchaseStatsBlockProps {
  stats: PurchaseStats;
  shopUrl: string;
}

export function PurchaseStatsBlock({ stats, shopUrl }: PurchaseStatsBlockProps) {
  const {
    totalOrders,
    totalSpentCents,
    lastOrderDate,
    daysSinceLastOrder,
    averageOrderValueCents,
    recentOrders,
  } = stats;

  const totalFormatted =
    totalSpentCents != null
      ? formatOrderTotal(totalSpentCents, "USD")
      : "—";
  const aovFormatted =
    averageOrderValueCents != null
      ? formatOrderTotal(averageOrderValueCents, "USD")
      : "—";
  const lastOrderFormatted =
    lastOrderDate != null
      ? new Date(lastOrderDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <Card className="border-zinc-700/50 bg-zinc-900/40">
      <CardContent className="py-4 space-y-4">
        <p className="text-sm font-medium text-zinc-300">
          Store history
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
          <StatItem label="Total orders" value={String(totalOrders)} />
          <StatItem label="Total spent" value={totalFormatted} />
          <StatItem label="Last order" value={lastOrderFormatted} />
          <StatItem
            label="Days since"
            value={
              daysSinceLastOrder != null
                ? daysSinceLastOrder === 0
                  ? "Today"
                  : `${daysSinceLastOrder}d`
                : "—"
            }
          />
          <StatItem label="Avg. order" value={aovFormatted} />
        </dl>
        {recentOrders.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-400">
              Recent purchases
            </p>
            <ul className="space-y-2">
              {recentOrders.map((order) => (
                <RecentOrderRow key={order.id} order={order} shopUrl={shopUrl} />
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className="font-medium text-zinc-200 mt-0.5">{value}</dd>
    </div>
  );
}

function RecentOrderRow({ order, shopUrl }: { order: Order; shopUrl: string }) {
  const label = formatOrderNumber(order);
  const total = formatOrderTotal(order.total_cents, order.currency);
  const date = new Date(order.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const buyAgainUrl = order.shop_url ?? shopUrl;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-zinc-800 last:border-0">
      <div className="min-w-0">
        <span className="font-medium text-zinc-200">Order {label}</span>
        <span className="text-zinc-400 text-sm ml-2">{date}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-300">{total}</span>
        <a
          href={buyAgainUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium px-2.5 py-1 transition-colors"
        >
          Buy again
        </a>
      </div>
    </li>
  );
}
