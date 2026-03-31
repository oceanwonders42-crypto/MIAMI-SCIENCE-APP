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
  const href = `${ROUTES.catalog}/${product.id}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-900/40 shadow-xl shadow-black/30 transition-all hover:border-primary-500/20 hover:shadow-primary-900/10 hover:bg-zinc-900/55">
      <div className="absolute right-2 top-2 z-20">
        <FavoriteButton productId={product.id} isFavorite={isFavorite} size="sm" />
      </div>

      <Link
        href={href}
        className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-t-3xl"
      >
        <div className="relative block aspect-square shrink-0 overflow-hidden">
          <ProductImageOrPlaceholder
            imageUrl={product.image_url}
            name={product.name}
            className="absolute inset-0 h-full w-full"
            priority={priorityImage}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <h3 className="min-w-0 text-left font-bold text-zinc-100 group-hover:text-primary-200 transition-colors line-clamp-2 text-sm leading-snug tracking-tight">
            {product.name}
          </h3>

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
        </div>
      </Link>

      <div className="mt-auto flex flex-col gap-2 px-4 pb-4">
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
    </article>
  );
}
