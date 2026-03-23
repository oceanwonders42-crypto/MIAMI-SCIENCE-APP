import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/lib/constants";
import {
  getLedgerEntryLabel,
  getLedgerEntryType,
} from "@/lib/rewards";
import type { RewardPointsLedgerEntry } from "@/types";

interface PointsHistoryBlockProps {
  balance: number;
  recentLedger: RewardPointsLedgerEntry[];
}

export function PointsHistoryBlock({ balance, recentLedger }: PointsHistoryBlockProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Points history</CardTitle>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {balance} pts
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentLedger.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No recent activity. Points from qualifying purchases will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentLedger.slice(0, 5).map((entry) => {
              const type = getLedgerEntryType(entry);
              const label = getLedgerEntryLabel(entry);
              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{label}</span>
                    <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        type === "earned"
                          ? "success"
                          : type === "redeemed"
                            ? "warning"
                            : "default"
                      }
                    >
                      {type === "earned" ? "+" : ""}
                      {entry.amount_delta} pts
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href={ROUTES.rewards}
          className="inline-block mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          View full rewards →
        </Link>
      </CardContent>
    </Card>
  );
}
