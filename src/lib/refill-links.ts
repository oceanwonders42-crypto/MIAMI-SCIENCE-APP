import type { SupabaseClient } from "@supabase/supabase-js";
import type { Supply } from "@/types";
import { SHOP_REFILL_URL } from "./constants";

export interface ProductLinkInfo {
  productId: string;
  shopUrl: string | null;
  links: { url: string; label: string }[];
}

/** Normalize name for matching: lowercase, trim, collapse spaces. */
export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Fetch all products and their links for refill URL resolution. Includes name -> productId for matching. */
export async function getProductLinksMap(
  supabase: SupabaseClient
): Promise<Map<string, ProductLinkInfo>> {
  const { data: products, error: pe } = await supabase
    .from("products")
    .select("id, shop_url, name");
  if (pe || !products?.length) return new Map();

  const { data: links, error: le } = await supabase
    .from("product_links")
    .select("product_id, url, label")
    .order("sort_order", { ascending: true });
  if (le) return new Map();

  const map = new Map<string, ProductLinkInfo>();
  for (const p of products as { id: string; shop_url: string | null; name: string }[]) {
    map.set(p.id, {
      productId: p.id,
      shopUrl: p.shop_url ?? null,
      links: [],
    });
  }
  for (const l of (links ?? []) as { product_id: string; url: string; label: string }[]) {
    const info = map.get(l.product_id);
    if (info && l.url) info.links.push({ url: l.url, label: l.label });
  }
  return map;
}

/** Build map of normalized product name -> product id for name-based refill matching. */
export async function getProductIdByNameMap(
  supabase: SupabaseClient
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name");
  if (error) return new Map();
  const byName = new Map<string, string>();
  for (const p of (data ?? []) as { id: string; name: string }[]) {
    const key = normalizeProductName(p.name);
    if (key) byName.set(key, p.id);
  }
  return byName;
}

/**
 * Resolve product id for a supply: use supply.product_id if set, else try matching supply name to product name.
 */
export function resolveProductIdForSupply(
  supply: Supply,
  productIdByNameMap: Map<string, string> | null
): string | null {
  if (supply.product_id) return supply.product_id;
  if (!productIdByNameMap || !supply.name?.trim()) return null;
  const key = normalizeProductName(supply.name);
  return productIdByNameMap.get(key) ?? null;
}

/**
 * Best refill URL for a supply: product_id or name-matched product → product_links.url (first), else product.shop_url, else fallback.
 */
export function getRefillUrlForSupply(
  supply: Supply,
  productLinksMap: Map<string, ProductLinkInfo> | null,
  fallbackUrl: string = SHOP_REFILL_URL,
  productIdByNameMap?: Map<string, string> | null
): string {
  if (!productLinksMap) return fallbackUrl;
  const productId =
    supply.product_id ??
    (productIdByNameMap ? resolveProductIdForSupply(supply, productIdByNameMap) : null);
  if (!productId) return fallbackUrl;
  const info = productLinksMap.get(productId);
  if (!info) return fallbackUrl;
  if (info.links.length > 0) return info.links[0].url;
  if (info.shopUrl) return info.shopUrl;
  return fallbackUrl;
}
