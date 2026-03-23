import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types";
import type { ProductLink } from "@/types";

export interface ProductWithLinks extends Product {
  links: { url: string; label: string }[];
}

export async function getProducts(
  supabase: SupabaseClient,
  limit = 500
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Product[];
}

export async function getProductById(
  supabase: SupabaseClient,
  productId: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (error) return null;
  return data as Product | null;
}

/** Fetch products by ids; returns Map id -> Product for quick lookup. */
export async function getProductsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, Product>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, image_url, shop_url")
    .in("id", unique);
  if (error) return new Map();
  const map = new Map<string, Product>();
  for (const p of (data ?? []) as Product[]) {
    map.set(p.id, p);
  }
  return map;
}

export async function getProductLinks(
  supabase: SupabaseClient,
  productId: string
): Promise<{ url: string; label: string }[]> {
  const { data, error } = await supabase
    .from("product_links")
    .select("url, label")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as { url: string; label: string }[];
}

export async function getProductWithLinks(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductWithLinks | null> {
  const [product, links] = await Promise.all([
    getProductById(supabase, productId),
    getProductLinks(supabase, productId),
  ]);
  if (!product) return null;
  return { ...product, links };
}

export async function getProductsWithLinks(
  supabase: SupabaseClient
): Promise<ProductWithLinks[]> {
  const products = await getProducts(supabase);
  const { data: linksData } = await supabase
    .from("product_links")
    .select("product_id, url, label")
    .order("sort_order", { ascending: true });
  const linksByProduct = new Map<string, { url: string; label: string }[]>();
  for (const l of (linksData ?? []) as { product_id: string; url: string; label: string }[]) {
    const arr = linksByProduct.get(l.product_id) ?? [];
    arr.push({ url: l.url, label: l.label });
    linksByProduct.set(l.product_id, arr);
  }
  return products.map((p) => ({
    ...p,
    links: linksByProduct.get(p.id) ?? [],
  }));
}

/** Primary buy URL: first product link or product shop_url. */
export function getProductBuyUrl(product: ProductWithLinks): string | null {
  if (product.links.length > 0) return product.links[0].url;
  return product.shop_url;
}

export function formatPrice(priceCents: number | null, currency = "USD"): string | null {
  if (priceCents == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}
