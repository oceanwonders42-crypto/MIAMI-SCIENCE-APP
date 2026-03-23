import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import type { AttentionItem } from "@/lib/attention-items";

interface NeedsAttentionBlockProps {
  items: AttentionItem[];
}

function borderClass(type: AttentionItem["type"]): string {
  switch (type) {
    case "low_supply":
    case "overdue_reorder":
      return "border-amber-200 dark:border-amber-800";
    case "delivered_not_added":
      return "border-primary-200 dark:border-primary-800";
    case "comeback_checkin":
    case "comeback_workout":
      return "border-primary-200 dark:border-primary-800";
    default:
      return "border-zinc-800";
  }
}

export function NeedsAttentionBlock({ items }: NeedsAttentionBlockProps) {
  if (items.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="py-4 text-center">
          <p className="text-sm text-zinc-400">
            Nothing needs attention right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className={borderClass(item.type)}>
          <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-sm text-zinc-400">
                {item.message}
              </p>
            </div>
            {item.ctaUrl.startsWith("http") ? (
              <a
                href={item.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2 px-3 text-sm transition-colors"
              >
                {item.ctaLabel}
              </a>
            ) : (
              <Link
                href={item.ctaUrl}
                className="shrink-0 rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2 px-3 text-sm transition-colors"
              >
                {item.ctaLabel}
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
