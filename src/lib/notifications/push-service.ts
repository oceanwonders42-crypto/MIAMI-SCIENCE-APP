import type { SupabaseClient } from "@supabase/supabase-js";
import { isApnsConfigured, sendApnsAlert } from "@/lib/notifications/apns-client";
import type { PushPlatform } from "@/lib/notifications/push-tokens";

export type { PushPlatform } from "@/lib/notifications/push-tokens";
export { upsertPushTokenForUser, registerPushToken } from "@/lib/notifications/push-tokens";

/**
 * Push notification delivery: Supabase push_tokens + APNs for iOS.
 * Android/web tokens are stored but not sent here (graceful skip).
 */

export interface PushMessage {
  title: string;
  body: string;
  /** Optional custom payload (merged into APNs root payload for iOS). */
  data?: Record<string, string>;
}

export type PushDeliveryResult =
  | { kind: "skipped" }
  | { kind: "delivered" }
  | { kind: "failed"; error: string };

function normalizePlatform(p?: string): PushPlatform {
  const x = (p ?? "web").toLowerCase();
  if (x === "ios" || x === "android" || x === "web") return x;
  return "web";
}

/**
 * Send push to a user's devices. iOS → APNs when configured; otherwise skipped silently.
 * Does not throw.
 */
export async function sendPush(
  supabase: SupabaseClient,
  userId: string,
  message: PushMessage
): Promise<PushDeliveryResult> {
  if (!isApnsConfigured()) {
    return { kind: "skipped" };
  }

  const { data: rows, error } = await supabase
    .from("push_tokens")
    .select("token, platform")
    .eq("user_id", userId);

  if (error || !rows?.length) {
    return { kind: "skipped" };
  }

  const iosTokens = rows.filter(
    (r) => normalizePlatform(r.platform ?? undefined) === "ios"
  );
  if (iosTokens.length === 0) {
    return { kind: "skipped" };
  }

  let anyOk = false;
  let lastErr = "";

  for (const row of iosTokens) {
    const res = await sendApnsAlert(row.token, {
      title: message.title,
      body: message.body,
      data: message.data,
    });
    if (res.ok) {
      anyOk = true;
      continue;
    }
    lastErr = res.error;
    if (res.shouldDropToken) {
      await supabase.from("push_tokens").delete().eq("user_id", userId).eq("token", row.token);
    }
  }

  if (anyOk) return { kind: "delivered" };
  return { kind: "failed", error: lastErr || "APNs send failed" };
}
