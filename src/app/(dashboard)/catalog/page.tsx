import { Suspense } from "react";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { getProductsWithLinks } from "@/lib/products";
import { getFavoriteProductIds } from "@/lib/favorites";
import { getCartCount } from "@/lib/cart";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CatalogCategoryTabs } from "@/components/catalog/CatalogCategoryTabs";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";

function CategoryTabsFallback() {
  return (
    <div className="flex gap-2 pb-1">
      <div className="h-9 w-16 shrink-0 rounded-full bg-zinc-800/80 animate-pulse" />
      <div className="h-9 w-24 shrink-0 rounded-full bg-zinc-800/60 animate-pulse" />
      <div className="h-9 w-28 shrink-0 rounded-full bg-zinc-800/60 animate-pulse" />
    </div>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryParam } = await searchParams;
  const activeCategory = categoryParam?.trim() || null;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const [role, products, favoriteIds, cartCount] = await Promise.all([
    getRole(supabase, userId),
    getProductsWithLinks(supabase),
    userId ? getFavoriteProductIds(supabase, userId) : Promise.resolve(new Set<string>()),
    userId ? getCartCount(supabase, userId) : Promise.resolve(0),
  ]);

  const isAdmin = role === "admin";

  const categoryNames = [
    ...new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c?.trim()))),
  ].sort((a, b) => a.localeCompare(b));

  const matchesCategory = (p: (typeof products)[0]) =>
    !activeCategory || (p.category?.trim() && p.category === activeCategory);

  const filtered = products.filter(matchesCategory);
  const favorites = filtered.filter((p) => favoriteIds.has(p.id));
  const others = filtered.filter((p) => !favoriteIds.has(p.id));

  return (
    <div className="min-h-full bg-zinc-950 pb-28 md:pb-10">
      <Header
        title="Shop"
        subtitle="Mia Science — premium formulas"
        className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md"
        action={
          <Link
            href={ROUTES.cart}
            className="rounded-2xl border border-white/[0.1] bg-zinc-900/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:border-primary-500/30 hover:text-white transition-colors"
          >
            {cartCount > 0 ? `Cart · ${cartCount}` : "Cart"}
          </Link>
        }
      />

      <div className="px-4 md:px-8 max-w-6xl mx-auto space-y-8 pt-6 pb-10">
        {products.length === 0 ? (
          <CatalogEmptyState isAdmin={isAdmin} />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-400/90">
                  Catalog
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-300">
                  {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                  {activeCategory ? (
                    <span className="text-zinc-500 font-normal"> · {activeCategory}</span>
                  ) : null}
                </p>
              </div>
              <a
                href={SHOP_REFILL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                Open mia-science.com →
              </a>
            </div>

            {categoryNames.length > 0 && (
              <Suspense fallback={<CategoryTabsFallback />}>
                <CatalogCategoryTabs categories={categoryNames} />
              </Suspense>
            )}

            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/30 px-6 py-14 text-center">
                <p className="text-zinc-400">No products in this category.</p>
                <Link
                  href={ROUTES.catalog}
                  className="mt-4 inline-block text-sm font-bold text-primary-400 hover:text-primary-300"
                >
                  View all products
                </Link>
              </div>
            ) : (
              <>
                {favorites.length > 0 && (
                  <section className="space-y-4">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-0.5">
                      Your favorites
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                      {favorites.map((p, i) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          isFavorite
                          priorityImage={i < 2}
                        />
                      ))}
                    </div>
                  </section>
                )}

                <section className="space-y-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 px-0.5">
                    {favorites.length > 0 ? "All products" : "Products"}
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {(favorites.length > 0 ? others : filtered).map((p, i) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        isFavorite={favoriteIds.has(p.id)}
                        priorityImage={favorites.length === 0 && i < 2}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
