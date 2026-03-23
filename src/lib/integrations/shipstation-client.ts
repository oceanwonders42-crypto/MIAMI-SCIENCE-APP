/**
 * ShipStation API client — production-minded, env-only config.
 * Uses SHIPSTATION_API_KEY; optional SHIPSTATION_BASE_URL (default https://api.shipstation.com).
 * Do not expose secrets; use server-side only.
 */

const DEFAULT_BASE_URL = "https://api.shipstation.com";

export type ShipStationConfig = {
  baseUrl: string;
  apiKey: string;
};

export function getShipStationConfig(): ShipStationConfig | null {
  const apiKey = process.env.SHIPSTATION_API_KEY?.trim();
  if (!apiKey) return null;
  const baseUrl = (process.env.SHIPSTATION_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  return { baseUrl, apiKey };
}

export function isShipStationConfigured(): boolean {
  return getShipStationConfig() !== null;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

async function request<T>(
  config: ShipStationConfig,
  method: string,
  path: string,
  query?: Record<string, string>
): Promise<ApiResult<T>> {
  const url = new URL(config.baseUrl + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        "API-Key": config.apiKey,
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

/** Raw ShipStation shipment (v2 list response item). */
export interface RawShipStationShipment {
  shipmentId?: number;
  orderId?: number;
  orderNumber?: string;
  carrierCode?: string;
  trackingNumber?: string;
  status?: string;
  shipDate?: string;
  estimatedDeliveryDate?: string;
  deliveredDate?: string;
  [key: string]: unknown;
}

/** List response. */
export interface RawShipStationShipmentsResponse {
  shipments?: RawShipStationShipment[];
  total?: number;
  page?: number;
  pages?: number;
  [key: string]: unknown;
}

export async function fetchShipments(
  config: ShipStationConfig,
  params?: { page?: number; page_size?: number; sales_order_id?: string }
): Promise<ApiResult<RawShipStationShipment[]>> {
  const query: Record<string, string> = {};
  if (params?.page != null) query.page = String(params.page);
  if (params?.page_size != null) query.page_size = String(params.page_size);
  if (params?.sales_order_id != null) query.sales_order_id = params.sales_order_id;
  const result = await request<RawShipStationShipmentsResponse>(
    config,
    "GET",
    "/v2/shipments",
    Object.keys(query).length ? query : undefined
  );
  if (!result.ok) return result;
  const list = result.data.shipments ?? [];
  return { ok: true, data: list };
}

export async function fetchShipmentById(
  config: ShipStationConfig,
  shipmentId: string | number
): Promise<ApiResult<RawShipStationShipment>> {
  return request<RawShipStationShipment>(config, "GET", `/v2/shipments/${shipmentId}`);
}

/** App-friendly normalized shipment (for sync/display). */
export interface NormalizedShipStationShipment {
  external_id: string | null;
  order_external_id: string | null;
  /** Store order number — used to link to orders.order_number / orders.external_id */
  order_number: string | null;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_at: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
}

export function normalizeShipStationShipment(raw: RawShipStationShipment): NormalizedShipStationShipment {
  const status = typeof raw.status === "string" ? raw.status : "unknown";
  return {
    external_id: raw.shipmentId != null ? String(raw.shipmentId) : null,
    order_external_id: raw.orderId != null ? String(raw.orderId) : null,
    order_number:
      raw.orderNumber != null && String(raw.orderNumber).trim() !== ""
        ? String(raw.orderNumber).trim()
        : null,
    carrier: typeof raw.carrierCode === "string" ? raw.carrierCode : null,
    tracking_number: typeof raw.trackingNumber === "string" ? raw.trackingNumber : null,
    status,
    shipped_at: typeof raw.shipDate === "string" ? raw.shipDate : null,
    estimated_delivery:
      typeof raw.estimatedDeliveryDate === "string" ? raw.estimatedDeliveryDate : null,
    delivered_at: typeof raw.deliveredDate === "string" ? raw.deliveredDate : null,
  };
}
