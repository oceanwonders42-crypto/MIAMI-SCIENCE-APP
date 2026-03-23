import Link from "next/link";
import type { Product } from "@/types";
import { ROUTES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface FavoritesBlockProps {
  products: Product[];
  /** First product link URL per product id (from product_links or shop_url). */
  buyUrlByProductId?: Map<string, string>;
}

export function FavoritesBlock({ products, buyUrlByProductId = new Map() }: FavoritesBlockProps) {
  if (products.length === 0) return null;

  const show = products.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Favorite products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-2">
          {show.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <Link
                href={`${ROUTES.catalog}/${p.id}`}
                className="text-sm font-medium text-zinc-100 hover:text-primary-400 transition-colors truncate"
              >
                {p.name}
              </Link>
              {buyUrlByProductId.get(p.id) ? (
                <a
                  href={buyUrlByProductId.get(p.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors shrink-0"
                >
                  Buy
                </a>
              ) : (
                <Link
                  href={`${ROUTES.catalog}/${p.id}`}
                  className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors shrink-0"
                >
                  View
                </Link>
              )}
            </li>
          ))}
        </ul>
        <Link
          href={ROUTES.catalog}
          className="inline-block text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Open catalog →
        </Link>
      </CardContent>
    </Card>
  );
}
