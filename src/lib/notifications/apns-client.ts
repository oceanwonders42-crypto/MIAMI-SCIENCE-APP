/**
 * Apple Push Notification service (APNs) via @parse/node-apn.
 * Server-only. If env is incomplete, helpers report unconfigured / skip sends.
 */

import * as apn from "@parse/node-apn";

let provider: apn.Provider | null | undefined;

function normalizePem(key: string): string {
  return key.replace(/\\n/g, "\n").trim();
}

function getApnsProvider(): apn.Provider | null {
  if (provider !== undefined) return provider;

  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const keyRaw = process.env.APNS_PRIVATE_KEY?.trim();
  if (!keyId || !teamId || !keyRaw) {
    provider = null;
    return null;
  }

  const production =
    process.env.APNS_PRODUCTION === "true" || process.env.APNS_PRODUCTION === "1";

  try {
    provider = new apn.Provider({
      token: {
        key: normalizePem(keyRaw),
        keyId,
        teamId,
      },
      production,
    });
  } catch {
    provider = null;
  }
  return provider;
}

export function isApnsConfigured(): boolean {
  return getApnsProvider() !== null;
}

function getTopic(): string {
  return process.env.APNS_BUNDLE_ID?.trim() || "com.miascience.tracker";
}

const DROP_TOKEN_REASONS = new Set([
  "BadDeviceToken",
  "Unregistered",
  "DeviceTokenNotForTopic",
]);

export type ApnsSendResult =
  | { ok: true }
  | { ok: false; error: string; shouldDropToken: boolean };

/**
 * Send an alert push to one hex-encoded APNs device token.
 */
export async function sendApnsAlert(
  deviceTokenHex: string,
  options: { title: string; body: string; data?: Record<string, string> }
): Promise<ApnsSendResult> {
  const svc = getApnsProvider();
  if (!svc) {
    return { ok: false, error: "APNs not configured", shouldDropToken: false };
  }

  const token = deviceTokenHex.replace(/\s/g, "");
  if (!token) {
    return { ok: false, error: "Empty device token", shouldDropToken: false };
  }

  try {
    const note = new apn.Notification();
    note.topic = getTopic();
    note.pushType = "alert";
    note.alert = { title: options.title, body: options.body };
    if (options.data && Object.keys(options.data).length > 0) {
      note.payload = { ...options.data };
    }

    const result = await svc.send(note, token);
    if (result.failed.length === 0) {
      return { ok: true };
    }
    const f = result.failed[0];
    const reason = f.response?.reason ?? f.error?.message ?? "Unknown APNs error";
    const shouldDropToken = DROP_TOKEN_REASONS.has(reason);
    return { ok: false, error: reason, shouldDropToken };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, shouldDropToken: false };
  }
}
