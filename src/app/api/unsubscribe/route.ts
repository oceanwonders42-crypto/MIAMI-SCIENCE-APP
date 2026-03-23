import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { unsubscribeEmailByToken } from "@/lib/notifications/email-unsubscribe";

function appOrigin(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  return new URL(request.url).origin;
}

/**
 * One-click unsubscribe (GET) — no login. Redirects to /unsubscribe with status query params.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t")?.trim() ?? "";
  const origin = appOrigin(request);

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe?e=missing", origin));
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await unsubscribeEmailByToken(supabase, token);
    if (result === "ok") {
      return NextResponse.redirect(new URL("/unsubscribe?ok=1", origin));
    }
    if (result === "invalid") {
      return NextResponse.redirect(new URL("/unsubscribe?e=invalid", origin));
    }
    return NextResponse.redirect(new URL("/unsubscribe?e=server", origin));
  } catch {
    return NextResponse.redirect(new URL("/unsubscribe?e=server", origin));
  }
}
