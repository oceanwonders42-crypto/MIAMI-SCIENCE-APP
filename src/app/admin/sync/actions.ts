"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import {
  runShipStationShipmentSync,
  type ShipStationSyncResult,
} from "@/lib/integrations/shipstation-sync";
import {
  fetchSquareInvoiceStatus,
  fetchSquareOrderStatus,
} from "@/lib/integrations/square-status";
import type { NormalizedSquareInvoice } from "@/lib/integrations/square-client";

const INTEGRATION_SHIPSTATION_SHIPMENTS = "shipstation_shipments";

export type ShipStationSyncActionResult =
  | { ok: true; result: ShipStationSyncResult }
  | { ok: false; error: string };

export async function runShipStationSyncAction(): Promise<ShipStationSyncActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    return { ok: false, error: "Admin only" };
  }

  const serviceClient = createServiceRoleClient();
  const outcome = await runShipStationShipmentSync(serviceClient);

  if (!outcome.ok) return { ok: false, error: outcome.error };

  const summary = {
    fetched: outcome.fetched,
    updated: outcome.updated,
    inserted: outcome.inserted,
    skippedNoOrder: outcome.skippedNoOrder,
    skippedNoExternalId: outcome.skippedNoExternalId,
    errorCount: outcome.errors.length,
  };

  // integration_sync_log not in generated DB types; safe to upsert by known shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from("integration_sync_log").upsert(
    {
      integration: INTEGRATION_SHIPSTATION_SHIPMENTS,
      last_run_at: new Date().toISOString(),
      summary,
    },
    { onConflict: "integration" }
  );

  return { ok: true, result: outcome };
}

export type SquareInvoiceActionResult =
  | { ok: true; invoice: NormalizedSquareInvoice }
  | { ok: false; error: string };

export async function fetchSquareInvoiceAction(
  invoiceId: string
): Promise<SquareInvoiceActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    return { ok: false, error: "Admin only" };
  }

  const result = await fetchSquareInvoiceStatus(invoiceId);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, invoice: result.invoice };
}

export type SquareOrderActionResult =
  | { ok: true; order_id: string; state: string; total_cents: number | null; currency: string }
  | { ok: false; error: string };

export async function fetchSquareOrderAction(
  orderId: string,
  locationId?: string
): Promise<SquareOrderActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    return { ok: false, error: "Admin only" };
  }

  const result = await fetchSquareOrderStatus(orderId, locationId);
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    order_id: result.order_id,
    state: result.state,
    total_cents: result.total_cents,
    currency: result.currency,
  };
}
