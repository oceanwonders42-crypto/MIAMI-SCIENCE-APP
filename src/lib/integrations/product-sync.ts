/**
 * WooCommerce product sync: fetch products from store API, normalize, upsert into products and product_links.
 * Idempotent: same external_id → update existing row; new external_id → insert.
 * Use service role Supabase client for writes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { INTEGRATION_KEYS, upsertIntegrationSyncLog } from "@/lib/admin/integration-log";
import {
  getWooCommerceConfig,
  fetchProducts,
  normalizeWooProduct,
  type RawWooProduct,
} from "./woocommerce-client";

export interface ProductSyncResult {
  ok: true;
  fetched: number;
  productsInserted: number;
  productsUpdated: number;
  linksEnsured: number;
  errors: string[];
}

export type ProductSyncOutcome =
  | ProductSyncResult
  | { ok: false; error: string };

const PER_PAGE = 100;
const SHOP_LINK_LABEL = "Shop";

/** Ensure a product has a "Shop" link with the given url; insert if missing. Returns 1 if inserted, 0 if already present. */
async function ensureShopLink(
  supabase: SupabaseClient,
  productId: string,
  shopUrl: string | null
): Promise<{ ensured: number; error?: string }> {
  if (!shopUrl?.trim()) return { ensured: 0 };

  const { data: existing } = await supabase
    .from("product_links")
    .select("id, url")
    .eq("product_id", productId);

  const links = (existing ?? []) as { id: string; url: string }[];
  const hasMatch = links.some((l) => l.url === shopUrl);
  if (hasMatch) return { ensured: 0 };

  const { error } = await supabase.from("product_links").insert({
    product_id: productId,
    label: SHOP_LINK_LABEL,
    url: shopUrl,
    sort_order: 0,
  });
  if (error) return { ensured: 0, error: error.message };
  return { ensured: 1 };
}

/** Generate a unique slug: prefer WooCommerce slug; if conflict use slug + "-" + externalId. */
async function resolveSlug(
  supabase: SupabaseClient,
  preferred: string,
  externalId: string,
  excludeProductId: string | null
): Promise<string> {
  const base = preferred.replace(/[^a-z0-9-_]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || externalId;
  let slug = base;
  let attempts = 0;
  while (attempts < 10) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    const conflict = data != null && (excludeProductId == null || (data as { id: string }).id !== excludeProductId);
    if (!conflict) return slug;
    slug = `${base}-${externalId}`;
    if (attempts > 0) slug = `${base}-${externalId}-${attempts}`;
    attempts++;
  }
  return `${base}-${externalId}`;
}

export async function runProductSync(
  supabase: SupabaseClient
): Promise<ProductSyncOutcome> {
  const config = getWooCommerceConfig();
  if (!config) {
    return { ok: false, error: "WooCommerce not configured (WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET)" };
  }

  const errors: string[] = [];
  let fetched = 0;
  let productsInserted = 0;
  let productsUpdated = 0;
  let linksEnsured = 0;

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchProducts(config, { per_page: PER_PAGE, page });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    const batch = result.data as RawWooProduct[];
    fetched += batch.length;
    hasMore = batch.length === PER_PAGE;

    for (const raw of batch) {
      const normalized = normalizeWooProduct(raw, config.baseUrl);
      const externalId = normalized.id;

      const { data: existing } = await supabase
        .from("products")
        .select("id, slug")
        .eq("external_id", externalId)
        .maybeSingle();

      const slug = await resolveSlug(
        supabase,
        normalized.slug,
        externalId,
        existing ? (existing as { id: string }).id : null
      );

      const row = {
        name: normalized.name,
        slug,
        image_url: normalized.image_url,
        shop_url: normalized.shop_url,
        description: normalized.description,
        price_cents: normalized.price_cents,
        category: normalized.category,
      };

      let productId: string | null = null;

      if (existing) {
        productId = (existing as { id: string }).id;
        const { error } = await supabase
          .from("products")
          .update(row)
          .eq("id", productId);
        if (error) {
          errors.push(`Product ${externalId}: ${error.message}`);
        } else {
          productsUpdated++;
        }
      } else {
        const { data: inserted, error } = await supabase
          .from("products")
          .insert({ ...row, external_id: externalId })
          .select("id")
          .single();
        if (error) {
          errors.push(`Product ${externalId}: ${error.message}`);
        } else {
          productsInserted++;
          productId = (inserted as { id: string }).id;
        }
      }

      if (productId) {
        const linkResult = await ensureShopLink(supabase, productId, normalized.shop_url);
        linksEnsured += linkResult.ensured;
        if (linkResult.error) errors.push(`Link ${externalId}: ${linkResult.error}`);
      }
    }

    page++;
  }

  await upsertIntegrationSyncLog(supabase, INTEGRATION_KEYS.WOOCOMMERCE_PRODUCTS, {
    ok: true,
    fetched,
    productsInserted,
    productsUpdated,
    linksEnsured,
    errorCount: errors.length,
  });

  return {
    ok: true,
    fetched,
    productsInserted,
    productsUpdated,
    linksEnsured,
    errors,
  };
}
