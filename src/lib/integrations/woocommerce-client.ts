/**
 * WooCommerce REST API client — production-minded, env-only config.
 * Uses WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET.
 * Do not expose secrets; use server-side only.
 */

import { stripHtmlToText } from "@/lib/strip-html";

const BASE_PATH = "/wp-json/wc/v3";

export type WooCommerceConfig = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

export function getWooCommerceConfig(): WooCommerceConfig | null {
  const baseUrl = process.env.WOOCOMMERCE_URL?.replace(/\/$/, "");
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  if (!baseUrl || !consumerKey || !consumerSecret) return null;
  return { baseUrl, consumerKey, consumerSecret };
}

export function isWooCommerceConfigured(): boolean {
  return getWooCommerceConfig() !== null;
}

/** Result type for safe API calls. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

async function request<T>(
  config: WooCommerceConfig,
  method: string,
  path: string,
  query?: Record<string, string>,
  body?: unknown
): Promise<ApiResult<T>> {
  const url = new URL(config.baseUrl + BASE_PATH + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || res.statusText, status: res.status };
    }
    const data = await res.json();
    return { ok: true, data: data as T };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/** Raw WooCommerce product shape (minimal for normalization). */
export interface RawWooProduct {
  id: number;
  name?: string;
  slug?: string;
  permalink?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  images?: Array<{ id: number; src?: string }>;
  description?: string;
  short_description?: string;
  categories?: Array<{ id: number; name?: string }>;
  [key: string]: unknown;
}

/** Raw WooCommerce order shape (minimal). */
export interface RawWooOrder {
  id: number;
  number?: string;
  status?: string;
  total?: string;
  currency?: string;
  date_created?: string;
  customer_id?: number;
  billing?: { email?: string } | null;
  line_items?: Array<{ name?: string; quantity?: number; product_id?: number }>;
  [key: string]: unknown;
}

/** Raw WooCommerce customer shape (minimal). */
export interface RawWooCustomer {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  /** WordPress role as returned by Woo customers endpoint when available. */
  role?: string;
  [key: string]: unknown;
}

/** Payload to create an order via WooCommerce REST API. Same backend as website. */
export interface CreateOrderPayload {
  line_items: Array<{ product_id: number; quantity: number }>;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    email: string;
    phone?: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
  };
  customer_id?: number;
  status?: string;
  coupon_code?: string;
}

/** Create order in WooCommerce. Order is source of truth; payment is not completed in app. */
export async function createOrder(
  config: WooCommerceConfig,
  payload: CreateOrderPayload
): Promise<ApiResult<RawWooOrder>> {
  const body: Record<string, unknown> = {
    line_items: payload.line_items,
    billing: payload.billing,
    status: payload.status ?? "pending",
  };
  if (payload.shipping) body.shipping = payload.shipping;
  if (payload.customer_id != null) body.customer_id = payload.customer_id;
  if (payload.coupon_code) body.coupon_lines = [{ code: payload.coupon_code }];
  return request<RawWooOrder>(config, "POST", "/orders", undefined, body);
}

export async function fetchProducts(
  config: WooCommerceConfig,
  params?: { per_page?: number; page?: number; status?: string }
): Promise<ApiResult<RawWooProduct[]>> {
  const query: Record<string, string> = {
    /** Only published products in the storefront catalog */
    status: params?.status ?? "publish",
  };
  if (params?.per_page != null) query.per_page = String(params.per_page);
  if (params?.page != null) query.page = String(params.page);
  return request<RawWooProduct[]>(config, "GET", "/products", query);
}

export async function fetchProductById(
  config: WooCommerceConfig,
  id: string | number
): Promise<ApiResult<RawWooProduct>> {
  return request<RawWooProduct>(config, "GET", `/products/${id}`);
}

export async function fetchOrders(
  config: WooCommerceConfig,
  params?: { per_page?: number; page?: number; status?: string }
): Promise<ApiResult<RawWooOrder[]>> {
  const query: Record<string, string> = {};
  if (params?.per_page != null) query.per_page = String(params.per_page);
  if (params?.page != null) query.page = String(params.page);
  if (params?.status != null) query.status = params.status;
  return request<RawWooOrder[]>(config, "GET", "/orders", Object.keys(query).length ? query : undefined);
}

export async function fetchOrderById(
  config: WooCommerceConfig,
  id: string | number
): Promise<ApiResult<RawWooOrder>> {
  return request<RawWooOrder>(config, "GET", `/orders/${id}`);
}

export async function fetchCustomers(
  config: WooCommerceConfig,
  params?: { per_page?: number; page?: number }
): Promise<ApiResult<RawWooCustomer[]>> {
  const query: Record<string, string> = {};
  if (params?.per_page != null) query.per_page = String(params.per_page);
  if (params?.page != null) query.page = String(params.page);
  return request<RawWooCustomer[]>(config, "GET", "/customers", Object.keys(query).length ? query : undefined);
}

/** Search customers (WooCommerce searches email, name, etc.). Caller must filter by exact normalized email. */
export async function fetchCustomersSearch(
  config: WooCommerceConfig,
  search: string,
  params?: { per_page?: number; page?: number }
): Promise<ApiResult<RawWooCustomer[]>> {
  const query: Record<string, string> = { search };
  if (params?.per_page != null) query.per_page = String(params.per_page);
  if (params?.page != null) query.page = String(params.page);
  return request<RawWooCustomer[]>(config, "GET", "/customers", query);
}

/** Fetch orders for a WooCommerce customer. Paginated. */
export async function fetchOrdersByCustomer(
  config: WooCommerceConfig,
  customerId: number,
  params?: { per_page?: number; page?: number; status?: string }
): Promise<ApiResult<RawWooOrder[]>> {
  const query: Record<string, string> = { customer: String(customerId) };
  if (params?.per_page != null) query.per_page = String(params.per_page);
  if (params?.page != null) query.page = String(params.page);
  if (params?.status != null) query.status = params.status;
  return request<RawWooOrder[]>(config, "GET", "/orders", query);
}

/** App-friendly normalized product (for catalog/sync). */
export interface NormalizedWooProduct {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  shop_url: string | null;
  description: string | null;
  price_cents: number | null;
  category: string | null;
}

export function normalizeWooProduct(raw: RawWooProduct, baseUrl: string): NormalizedWooProduct {
  const price = raw.sale_price ?? raw.price ?? raw.regular_price;
  let price_cents: number | null = null;
  if (typeof price === "string" && price) {
    const n = parseFloat(price.replace(/,/g, ""));
    if (!Number.isNaN(n)) price_cents = Math.round(n * 100);
  }
  const category = raw.categories?.[0]?.name ?? null;
  const image_url = raw.images?.[0]?.src ?? null;
  /** Storefront product URL — permalink is canonical on Woo */
  const shop_url =
    typeof raw.permalink === "string" && raw.permalink.trim()
      ? raw.permalink.trim()
      : baseUrl
        ? `${baseUrl}/product/${raw.slug ?? raw.id}/`
        : null;

  const rawHtml =
    typeof raw.short_description === "string" && raw.short_description.trim()
      ? raw.short_description
      : typeof raw.description === "string" && raw.description.trim()
        ? raw.description
        : null;
  const description = stripHtmlToText(rawHtml) ?? (rawHtml ? rawHtml.replace(/<[^>]+>/g, " ").trim() : null);

  return {
    id: String(raw.id),
    name: typeof raw.name === "string" ? raw.name : "Product",
    slug: typeof raw.slug === "string" ? raw.slug : String(raw.id),
    image_url,
    shop_url,
    description,
    price_cents,
    category,
  };
}

/** App-friendly normalized order (for sync/display). */
export interface NormalizedWooOrder {
  external_id: string;
  order_number: string;
  status: string;
  total_cents: number | null;
  currency: string;
  item_count: number;
  shop_url: string | null;
  created_at: string;
  line_items: Array<{ name: string; quantity: number; product_id: string }>;
}

/** WooCommerce coupon (minimal fields for affiliate promo verification). */
export interface RawWooCoupon {
  id: number;
  code?: string;
  email_restrictions?: string[];
  discount_type?: string;
  amount?: string;
  [key: string]: unknown;
}

/**
 * Search coupons by code string (WooCommerce `search` may return multiple; filter with pickCouponMatchingCode).
 */
export async function fetchCouponsByCodeSearch(
  config: WooCommerceConfig,
  code: string
): Promise<ApiResult<RawWooCoupon[]>> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Coupon code required" };
  return request<RawWooCoupon[]>(config, "GET", "/coupons", { search: trimmed });
}

export function pickCouponMatchingCode(
  rows: RawWooCoupon[],
  wanted: string
): RawWooCoupon | null {
  const w = wanted.trim().toLowerCase();
  if (!w) return null;
  for (const c of rows) {
    const ccode = typeof c.code === "string" ? c.code.trim().toLowerCase() : "";
    if (ccode === w) return c;
  }
  return null;
}

/**
 * Allowed emails on coupon: empty → any billing email. Otherwise affiliate email must be listed.
 */
export function couponEmailRestrictionsAllow(
  restrictions: string[] | null | undefined,
  affiliateEmail: string | null | undefined
): { ok: boolean; reason: "no_restrictions" | "allowed" | "missing_affiliate_email" | "blocked" } {
  const list = (restrictions ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return { ok: true, reason: "no_restrictions" };
  const em = (affiliateEmail ?? "").trim().toLowerCase();
  if (!em) return { ok: false, reason: "missing_affiliate_email" };
  if (list.includes(em)) return { ok: true, reason: "allowed" };
  return { ok: false, reason: "blocked" };
}

export function normalizeWooOrder(raw: RawWooOrder, baseUrl: string): NormalizedWooOrder {
  const total = raw.total != null ? parseFloat(String(raw.total).replace(/,/g, "")) : NaN;
  const total_cents = !Number.isNaN(total) ? Math.round(total * 100) : null;
  const line_items = (raw.line_items ?? []).map((item) => ({
    name: typeof item.name === "string" ? item.name : "Item",
    quantity: typeof item.quantity === "number" ? item.quantity : 1,
    product_id: item.product_id != null ? String(item.product_id) : "",
  }));
  return {
    external_id: String(raw.id),
    order_number: raw.number != null ? String(raw.number) : String(raw.id),
    status: typeof raw.status === "string" ? raw.status : "pending",
    total_cents,
    currency: typeof raw.currency === "string" ? raw.currency : "USD",
    item_count: line_items.length,
    shop_url: baseUrl ? `${baseUrl}/my-account/orders` : null,
    created_at: typeof raw.date_created === "string" ? raw.date_created : new Date().toISOString(),
    line_items,
  };
}
