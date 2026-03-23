/**
 * ShipStation shipment sync — fetch live data and upsert into app shipments table.
 * Links to orders via order_number / external_id. Idempotent by shipments.external_id.
 * Server-only; use service role Supabase.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getShipStationConfig,
  fetchShipments,
  normalizeShipStationShipment,
  type NormalizedShipStationShipment,
} from "./shipstation-client";

const DEFAULT_PAGE_SIZE = 100;

function toDateOnly(value: string | null): string | null {
  if (value == null) return null;
  const s = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function toTimestamp(value: string | null): string | null {
  if (value == null) return null;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return null;
}

export type ShipStationSyncResult = {
  ok: true;
  fetched: number;
  updated: number;
  inserted: number;
  skippedNoOrder: number;
  skippedNoExternalId: number;
  errors: { external_id: string | null; message: string }[];
};

export type ShipStationSyncOutcome =
  | ShipStationSyncResult
  | { ok: false; error: string };

/**
 * Resolve app order id from normalized shipment (order_number or order_external_id).
 * Tries order_number first (store order number), then external_id match to orders.external_id.
 */
async function resolveOrderId(
  supabase: SupabaseClient,
  n: NormalizedShipStationShipment
): Promise<string | null> {
  if (n.order_number) {
    const { data: byNumber } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", n.order_number)
      .maybeSingle();
    if (byNumber) return (byNumber as { id: string }).id;
    const { data: byExternal } = await supabase
      .from("orders")
      .select("id")
      .eq("external_id", n.order_number)
      .maybeSingle();
    if (byExternal) return (byExternal as { id: string }).id;
  }
  if (n.order_external_id) {
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("external_id", n.order_external_id)
      .maybeSingle();
    if (data) return (data as { id: string }).id;
  }
  return null;
}

/**
 * Run full ShipStation shipment sync: fetch all pages, normalize, link to orders, upsert by external_id.
 */
export async function runShipStationShipmentSync(
  supabase: SupabaseClient
): Promise<ShipStationSyncOutcome> {
  const config = getShipStationConfig();
  if (!config) {
    return { ok: false, error: "ShipStation not configured" };
  }

  const errors: { external_id: string | null; message: string }[] = [];
  let fetched = 0;
  let updated = 0;
  let inserted = 0;
  let skippedNoOrder = 0;
  let skippedNoExternalId = 0;

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await fetchShipments(config, {
      page,
      page_size: DEFAULT_PAGE_SIZE,
    });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    const list = result.data;
    fetched += list.length;
    if (list.length === 0) {
      hasMore = false;
      break;
    }

    for (const raw of list) {
      const n = normalizeShipStationShipment(raw);
      if (!n.external_id) {
        skippedNoExternalId += 1;
        continue;
      }

      const order_id = await resolveOrderId(supabase, n);
      if (!order_id) {
        skippedNoOrder += 1;
        continue;
      }

      const shipped_at = toTimestamp(n.shipped_at);
      const estimated_delivery = toDateOnly(n.estimated_delivery);
      const delivered_at = toTimestamp(n.delivered_at);

      const { data: existing } = await supabase
        .from("shipments")
        .select("id")
        .eq("external_id", n.external_id)
        .maybeSingle();

      const row = {
        order_id,
        external_id: n.external_id,
        carrier: n.carrier,
        tracking_number: n.tracking_number,
        status: n.status,
        shipped_at,
        estimated_delivery,
        delivered_at,
      };

      if (existing) {
        const { error } = await supabase
          .from("shipments")
          .update({
            order_id: row.order_id,
            carrier: row.carrier,
            tracking_number: row.tracking_number,
            status: row.status,
            shipped_at: row.shipped_at,
            estimated_delivery: row.estimated_delivery,
            delivered_at: row.delivered_at,
          })
          .eq("id", (existing as { id: string }).id);
        if (error) {
          errors.push({ external_id: n.external_id, message: error.message });
        } else {
          updated += 1;
        }
      } else {
        const { error } = await supabase.from("shipments").insert({
          order_id: row.order_id,
          external_id: row.external_id,
          carrier: row.carrier,
          tracking_number: row.tracking_number,
          status: row.status,
          shipped_at: row.shipped_at,
          estimated_delivery: row.estimated_delivery,
          delivered_at: row.delivered_at,
        });
        if (error) {
          errors.push({ external_id: n.external_id, message: error.message });
        } else {
          inserted += 1;
        }
      }
    }

    if (list.length < DEFAULT_PAGE_SIZE) {
      hasMore = false;
    } else {
      page += 1;
    }
  }

  return {
    ok: true,
    fetched,
    updated,
    inserted,
    skippedNoOrder,
    skippedNoExternalId,
    errors,
  };
}
