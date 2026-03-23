import Link from "next/link";
import type { ProductWithLinks } from "@/lib/products";
import { getProductBuyUrl, formatPrice } from "@/lib/products";
import { ROUTES } from "@/lib/constants";
import { FavoriteButton } from "./FavoriteButton";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImageOrPlaceholder } from "./ProductImageOrPlaceholder";

interface ProductCardProps {
  product: ProductWithLinks;
  isFavorite: boolean;
  priorityImage?: boolean;
}

export function ProductCard({ product, isFavorite, priorityImage }: ProductCardProps) {
  const buyUrl = getProductBuyUrl(product);
  const priceStr = formatPrice(product.price_cents);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-900/40 shadow-xl shadow-black/30 transition-all hover:border-primary-500/20 hover:shadow-primary-900/10 hover:bg-zinc-900/55">
      <Link href={`${ROUTES.catalog}/${product.id}`} className="relative block aspect-square overflow-hidden">
        <ProductImageOrPlaceholder
          imageUrl={product.image_url}
          name={product.name}
          className="absolute inset-0 h-full w-full"
          priority={priorityImage}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60" />
      </Link>

      <div className="flex flex-col flex-1 p-4 min-h-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`${ROUTES.catalog}/${product.id}`}
            className="min-w-0 font-bold text-zinc-100 group-hover:text-primary-200 transition-colors line-clamp-2 text-sm leading-snug tracking-tight"
          >
            {product.name}
          </Link>
          <FavoriteButton productId={product.id} isFavorite={isFavorite} size="sm" />
        </div>

        {product.category ? (
          <span className="mt-1.5 inline-flex w-fit rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {product.category}
          </span>
        ) : null}

        {priceStr ? (
          <p className="mt-3 text-lg font-black tabular-nums tracking-tight text-white">{priceStr}</p>
        ) : (
          <p className="mt-3 text-sm font-semibold text-zinc-500">See store for price</p>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-4">
          {buyUrl ? (
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-2xl bg-primary-400 py-3 text-sm font-bold text-zinc-950 shadow-md shadow-primary-900/20 hover:bg-primary-300 active:scale-[0.99] transition-all"
            >
              Shop now
            </a>
          ) : null}
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            quantity={1}
            variant="default"
            size="sm"
            className="w-full justify-center border border-white/[0.1] bg-transparent hover:bg-zinc-800/80"
          />
        </div>
      </div>
    </article>
  );
}
