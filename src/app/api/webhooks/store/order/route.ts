import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { INTEGRATION_KEYS, upsertIntegrationSyncLog } from "@/lib/admin/integration-log";
import { isStoreSyncEnabled, verifyWooCommerceWebhookSignature } from "@/lib/integrations/store-config";
import { processStoreOrderWebhook } from "@/lib/integrations/store-sync";

const SIGNATURE_HEADER = "x-wc-webhook-signature";

export async function POST(request: NextRequest) {
  try {
    if (!isStoreSyncEnabled()) {
      return NextResponse.json(
        { error: "Store webhook not configured" },
        { status: 503 }
      );
    }

    const signature = request.headers.get(SIGNATURE_HEADER);
    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!rawBody?.trim()) {
      return NextResponse.json(
        { error: "Empty body" },
        { status: 400 }
      );
    }

    if (!verifyWooCommerceWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody) as unknown;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const result = await processStoreOrderWebhook(payload, { supabase });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await upsertIntegrationSyncLog(supabase, INTEGRATION_KEYS.STORE_ORDER_WEBHOOK, {
      ok: true,
      orderId: result.orderId,
    });

    return NextResponse.json({ ok: true, orderId: result.orderId }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

