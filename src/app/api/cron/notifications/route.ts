import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { INTEGRATION_KEYS, upsertIntegrationSyncLog } from "@/lib/admin/integration-log";
import { runScheduledNotifications } from "@/lib/notifications/run-scheduled-notifications";

const AUTH_HEADER = "authorization";
const BEARER_PREFIX = "Bearer ";

function getSecret(): string | null {
  return process.env.NOTIFICATION_CRON_SECRET ?? process.env.CRON_SECRET ?? null;
}

function validateRequest(request: NextRequest): boolean {
  const secret = getSecret()?.trim();
  if (!secret) return false;
  const auth = request.headers.get(AUTH_HEADER);
  const bearerToken = auth?.startsWith(BEARER_PREFIX) ? auth.slice(BEARER_PREFIX.length).trim() : null;
  if (bearerToken && bearerToken === secret) return true;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret && querySecret === secret) return true;
  return false;
}

/**
 * Secure cron endpoint to run scheduled notifications.
 * Auth: Authorization: Bearer <secret> (POST) or ?secret=<secret> (GET, for cron services that only support GET).
 * POST or GET /api/cron/notifications
 */
async function run(request: NextRequest) {
  if (!getSecret()?.trim()) {
    return NextResponse.json(
      { error: "Cron not configured" },
      { status: 503 }
    );
  }
  if (!validateRequest(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  try {
    const supabase = createServiceRoleClient();
    const summary = await runScheduledNotifications(supabase);
    await upsertIntegrationSyncLog(supabase, INTEGRATION_KEYS.NOTIFICATIONS_CRON, {
      ok: true,
      summary,
    });
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return run(request);
}

export async function GET(request: NextRequest) {
  return run(request);
}
