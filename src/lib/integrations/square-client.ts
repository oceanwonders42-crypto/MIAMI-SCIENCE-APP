/**
 * Square API client — production-minded, env-only config.
 * Uses SQUARE_ACCESS_TOKEN, SQUARE_ENVIRONMENT (sandbox | production).
 * Do not expose secrets; use server-side only.
 */

const BASE_URLS = {
  production: "https://connect.squareup.com",
  sandbox: "https://connect.squareupsandbox.com",
} as const;

export type SquareConfig = {
  baseUrl: string;
  accessToken: string;
  environment: "sandbox" | "production";
};

export function getSquareConfig(): SquareConfig | null {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim();
  const env = process.env.SQUARE_ENVIRONMENT?.toLowerCase();
  if (!accessToken) return null;
  const environment = env === "sandbox" ? "sandbox" : "production";
  const baseUrl = BASE_URLS[environment];
  return { baseUrl, accessToken, environment };
}

export function isSquareConfigured(): boolean {
  return getSquareConfig() !== null;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

async function request<T>(
  config: SquareConfig,
  method: string,
  path: string
): Promise<ApiResult<T>> {
  const url = config.baseUrl + path;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
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

/** Square API invoice response wrapper. */
export interface RawSquareInvoiceResponse {
  invoice?: RawSquareInvoice;
  errors?: Array<{ code?: string; detail?: string }>;
  [key: string]: unknown;
}

export interface RawSquareInvoice {
  id?: string;
  order_id?: string;
  status?: string;
  payment_requests?: Array<{
    computed_amount_money?: { amount?: number; currency?: string };
    tipping?: unknown;
  }>;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export async function fetchInvoiceById(
  config: SquareConfig,
  invoiceId: string
): Promise<ApiResult<RawSquareInvoice | null>> {
  const result = await request<RawSquareInvoiceResponse>(
    config,
    "GET",
    `/v2/invoices/${encodeURIComponent(invoiceId)}`
  );
  if (!result.ok) return result;
  if (result.data.errors?.length) {
    return { ok: false, error: result.data.errors.map((e) => e.detail ?? e.code).join("; ") };
  }
  return { ok: true, data: result.data.invoice ?? null };
}

/** Square order response (Orders API v2). */
export interface RawSquareOrderResponse {
  order?: RawSquareOrder;
  errors?: Array<{ code?: string; detail?: string }>;
  [key: string]: unknown;
}

export interface RawSquareOrder {
  id?: string;
  state?: string;
  total_money?: { amount?: number; currency?: string };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export async function fetchOrderById(
  config: SquareConfig,
  orderId: string,
  locationId?: string
): Promise<ApiResult<RawSquareOrder | null>> {
  const loc = locationId ?? process.env.SQUARE_LOCATION_ID;
  const path = loc
    ? `/v2/orders/${encodeURIComponent(orderId)}?location_id=${encodeURIComponent(loc)}`
    : `/v2/orders/${encodeURIComponent(orderId)}`;
  const result = await request<RawSquareOrderResponse>(config, "GET", path);
  if (!result.ok) return result;
  if (result.data.errors?.length) {
    return { ok: false, error: result.data.errors.map((e) => e.detail ?? e.code).join("; ") };
  }
  return { ok: true, data: result.data.order ?? null };
}

/** App-friendly normalized invoice/payment status. */
export interface NormalizedSquareInvoice {
  id: string;
  order_id: string | null;
  status: string;
  amount_cents: number | null;
  currency: string;
  created_at: string | null;
  updated_at: string | null;
}

export function normalizeSquareInvoice(raw: RawSquareInvoice | null): NormalizedSquareInvoice | null {
  if (!raw || raw.id == null) return null;
  const amount = raw.payment_requests?.[0]?.computed_amount_money?.amount;
  const amount_cents = typeof amount === "number" ? amount : null;
  const currency = raw.payment_requests?.[0]?.computed_amount_money?.currency ?? "USD";
  return {
    id: String(raw.id),
    order_id: raw.order_id != null ? String(raw.order_id) : null,
    status: typeof raw.status === "string" ? raw.status : "unknown",
    amount_cents,
    currency,
    created_at: typeof raw.created_at === "string" ? raw.created_at : null,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}
