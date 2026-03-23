import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";
import type { Supply } from "@/types";
import { isLowSupply } from "@/lib/supplies";

interface LowSupplyAlertCardProps {
  supplies: Supply[];
}

export function LowSupplyAlertCard({ supplies }: LowSupplyAlertCardProps) {
  const low = supplies.filter((s) => isLowSupply(s));
  if (low.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {low.length} item{low.length !== 1 ? "s" : ""} below your alert threshold
        </p>
        <div className="flex gap-2">
          <Link
            href={ROUTES.stack}
            className="rounded-lg border border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400 font-medium py-2 px-3 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            View stack
          </Link>
          <a
            href={SHOP_REFILL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-3 text-sm"
          >
            Shop refill
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
