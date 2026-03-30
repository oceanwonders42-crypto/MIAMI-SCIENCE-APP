/**
 * Internal diagnostics for external integrations.
 * Reports configured/callable status only — no secrets.
 */

import {
  isWooCommerceConfigured,
  getWooCommerceConfig,
  fetchProducts,
} from "./woocommerce-client";
import {
  isShipStationConfigured,
  getShipStationConfig,
  fetchShipments,
} from "./shipstation-client";
import {
  isSquareConfigured,
  getSquareConfig,
  fetchInvoiceById,
} from "./square-client";
import { isSliceWPSyncEnabled, checkSliceWPConnectivity } from "./slicewp";

export type IntegrationStatus = {
  name: string;
  configured: boolean;
  callable: boolean;
  callableError?: string;
};

/**
 * Whether an integration has required env vars set (no secret values returned).
 */
export function getWooCommerceStatus(): IntegrationStatus {
  const configured = isWooCommerceConfigured();
  return {
    name: "WooCommerce",
    configured,
    callable: false,
  };
}

export function getShipStationStatus(): IntegrationStatus {
  const configured = isShipStationConfigured();
  return {
    name: "ShipStation",
    configured,
    callable: false,
  };
}

export function getSquareStatus(): IntegrationStatus {
  const configured = isSquareConfigured();
  return {
    name: "Square",
    configured,
    callable: false,
  };
}

export function getSliceWPStatus(): IntegrationStatus {
  const configured = isSliceWPSyncEnabled();
  return {
    name: "SliceWP",
    configured,
    callable: false,
  };
}

/**
 * All integration statuses (no live call).
 */
export function getAllIntegrationStatuses(): IntegrationStatus[] {
  return [
    getWooCommerceStatus(),
    getSliceWPStatus(),
    getShipStationStatus(),
    getSquareStatus(),
  ];
}

/**
 * Optional: run a minimal API call to see if the integration is callable.
 * Use only in admin diagnostics; do not log responses that might contain secrets.
 */
export async function checkWooCommerceCallable(): Promise<{ callable: boolean; error?: string }> {
  const config = getWooCommerceConfig();
  if (!config) return { callable: false, error: "Not configured" };
  const result = await fetchProducts(config, { per_page: 1 });
  if (result.ok) return { callable: true };
  return { callable: false, error: result.error };
}

export async function checkShipStationCallable(): Promise<{ callable: boolean; error?: string }> {
  const config = getShipStationConfig();
  if (!config) return { callable: false, error: "Not configured" };
  const result = await fetchShipments(config, { page_size: 1 });
  if (result.ok) return { callable: true };
  return { callable: false, error: result.error };
}

export async function checkSquareCallable(): Promise<{ callable: boolean; error?: string }> {
  const config = getSquareConfig();
  if (!config) return { callable: false, error: "Not configured" };
  const result = await fetchInvoiceById(config, "dummy-id-for-401-check");
  if (result.ok) return { callable: true };
  if (result.status === 404) return { callable: true };
  return { callable: false, error: result.error };
}

/**
 * Get all statuses with callable checks run (for admin diagnostics page).
 */
export async function getIntegrationStatusesWithCallable(): Promise<IntegrationStatus[]> {
  const [woo, slice, ship, square] = await Promise.all([
    (async () => {
      const s = getWooCommerceStatus();
      const c = await checkWooCommerceCallable();
      return { ...s, callable: c.callable, callableError: c.error };
    })(),
    (async () => {
      const s = getSliceWPStatus();
      const c = await checkSliceWPConnectivity();
      return { ...s, callable: c.ok, callableError: c.error };
    })(),
    (async () => {
      const s = getShipStationStatus();
      const c = await checkShipStationCallable();
      return { ...s, callable: c.callable, callableError: c.error };
    })(),
    (async () => {
      const s = getSquareStatus();
      const c = await checkSquareCallable();
      return { ...s, callable: c.callable, callableError: c.error };
    })(),
  ]);
  return [woo, slice, ship, square];
}
