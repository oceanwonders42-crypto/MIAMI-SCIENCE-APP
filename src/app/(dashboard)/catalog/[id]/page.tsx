import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getProductWithLinks, getProductBuyUrl, formatPrice } from "@/lib/products";
import { getFavoriteProductIds } from "@/lib/favorites";
import { Header } from "@/components/layout/Header";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ProductImageOrPlaceholder } from "@/components/catalog/ProductImageOrPlaceholder";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";
import { stripHtmlToText } from "@/lib/strip-html";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [product, favoriteIds] = await Promise.all([
    getProductWithLinks(supabase, id),
    userId ? getFavoriteProductIds(supabase, userId) : Promise.resolve(new Set<string>()),
  ]);

  if (!product) notFound();

  const buyUrl = getProductBuyUrl(product) ?? product.shop_url;
  const priceStr = formatPrice(product.price_cents);
  const descriptionPlain =
    stripHtmlToText(product.description) ??
    (product.description?.replace(/<[^>]+>/g, " ").trim() || null);

  return (
    <div className="min-h-full bg-zinc-950 pb-28 md:pb-10">
      <Header
        title="Product"
        subtitle={product.category ?? "Mia Science"}
        backHref={ROUTES.catalog}
        className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md"
      />

      <div className="px-4 md:px-8 max-w-4xl mx-auto space-y-8 pt-6 pb-10">
        <article className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/50 to-zinc-950 shadow-2xl shadow-black/40">
          <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full border-b border-white/[0.06]">
            <ProductImageOrPlaceholder
              imageUrl={product.image_url}
              name={product.name}
              className="absolute inset-0 h-full w-full"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-70" />
          </div>

          <div className="p-5 sm:p-8 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  {product.name}
                </h1>
                {product.category ? (
                  <span className="mt-3 inline-flex rounded-full border border-white/[0.1] bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {product.category}
                  </span>
                ) : null}
              </div>
              <FavoriteButton
                productId={product.id}
                isFavorite={favoriteIds.has(product.id)}
                size="md"
              />
            </div>

            {priceStr ? (
              <p className="text-3xl font-black tabular-nums tracking-tight text-primary-200">{priceStr}</p>
            ) : (
              <p className="text-lg font-semibold text-zinc-500">See mia-science.com for pricing</p>
            )}

            {descriptionPlain ? (
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  About
                </p>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line">
                  {descriptionPlain}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
              {buyUrl ? (
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 min-w-[200px] items-center justify-center rounded-2xl bg-primary-400 py-4 text-sm font-bold text-zinc-950 shadow-lg shadow-primary-900/25 hover:bg-primary-300 transition-colors"
                >
                  Buy on mia-science.com
                </a>
              ) : (
                <a
                  href={SHOP_REFILL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 min-w-[200px] items-center justify-center rounded-2xl bg-primary-400 py-4 text-sm font-bold text-zinc-950 shadow-lg shadow-primary-900/25 hover:bg-primary-300 transition-colors"
                >
                  Shop mia-science.com
                </a>
              )}
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                quantity={1}
                variant="default"
                size="md"
                className="flex-1 min-w-[200px] rounded-2xl border border-white/[0.12] bg-zinc-900/50 py-4 font-bold"
              />
            </div>

            {product.links.length > 1 &&
              product.links.slice(1, 5).map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mr-4 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                >
                  {l.label} →
                </a>
              ))}
          </div>
        </article>

        <Link
          href={ROUTES.catalog}
          className="inline-flex text-sm font-bold text-zinc-500 hover:text-primary-300 transition-colors"
        >
          ← Back to catalog
        </Link>
      </div>
    </div>
  );
}
