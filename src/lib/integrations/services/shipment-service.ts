/**
 * Integration service: shipments from external APIs → app-friendly shape.
 * Uses ShipStation client; other sources can be added later.
 */

import {
  getShipStationConfig,
  fetchShipments,
  fetchShipmentById,
  normalizeShipStationShipment,
  type NormalizedShipStationShipment,
} from "../shipstation-client";

export type NormalizedShipment = NormalizedShipStationShipment;

export async function getShipmentsFromShipStation(params?: {
  page?: number;
  page_size?: number;
  sales_order_id?: string;
}): Promise<{ ok: true; shipments: NormalizedShipment[] } | { ok: false; error: string }> {
  const config = getShipStationConfig();
  if (!config) return { ok: false, error: "ShipStation not configured" };
  const result = await fetchShipments(config, params);
  if (!result.ok) return { ok: false, error: result.error };
  const shipments = result.data.map(normalizeShipStationShipment);
  return { ok: true, shipments };
}

export async function getShipmentByIdFromShipStation(
  shipmentId: string
): Promise<{ ok: true; shipment: NormalizedShipment } | { ok: false; error: string }> {
  const config = getShipStationConfig();
  if (!config) return { ok: false, error: "ShipStation not configured" };
  const result = await fetchShipmentById(config, shipmentId);
  if (!result.ok) return { ok: false, error: result.error };
  const shipment = normalizeShipStationShipment(result.data);
  return { ok: true, shipment };
}
