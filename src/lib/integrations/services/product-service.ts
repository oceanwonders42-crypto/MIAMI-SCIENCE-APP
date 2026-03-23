/**
 * Integration service: products from external APIs → app-friendly shape.
 * Uses WooCommerce client; other sources can be added later.
 */

import {
  getWooCommerceConfig,
  fetchProducts,
  fetchProductById,
  normalizeWooProduct,
  type NormalizedWooProduct,
} from "../woocommerce-client";

export type NormalizedProduct = NormalizedWooProduct;

export async function getProductsFromWooCommerce(params?: {
  per_page?: number;
  page?: number;
}): Promise<{ ok: true; products: NormalizedProduct[] } | { ok: false; error: string }> {
  const config = getWooCommerceConfig();
  if (!config) return { ok: false, error: "WooCommerce not configured" };
  const result = await fetchProducts(config, params);
  if (!result.ok) return { ok: false, error: result.error };
  const products = result.data.map((raw) => normalizeWooProduct(raw, config.baseUrl));
  return { ok: true, products };
}

export async function getProductByIdFromWooCommerce(
  id: string
): Promise<{ ok: true; product: NormalizedProduct } | { ok: false; error: string }> {
  const config = getWooCommerceConfig();
  if (!config) return { ok: false, error: "WooCommerce not configured" };
  const result = await fetchProductById(config, id);
  if (!result.ok) return { ok: false, error: result.error };
  const product = normalizeWooProduct(result.data, config.baseUrl);
  return { ok: true, product };
}
