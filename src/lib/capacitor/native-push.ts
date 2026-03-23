"use client";

/**
 * Capacitor native push: listeners + permission/register.
 * No-op on web; errors are swallowed (graceful degradation).
 */

import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
import { registerPushTokenAction } from "@/app/(dashboard)/account/actions";

export function isNativeCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { getPlatform: () => string } }).Capacitor;
  return Boolean(cap && cap.getPlatform() !== "web");
}

/** True when running inside the native iOS shell (push toggle is iOS-only in account settings). */
export function isIOSCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { getPlatform: () => string } }).Capacitor;
  return Boolean(cap && cap.getPlatform() === "ios");
}

async function attachPushTokenListeners(): Promise<() => void> {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  const handleReg = await PushNotifications.addListener("registration", async (event) => {
    try {
      const platform = Capacitor.getPlatform();
      if (platform === "web") return;
      await registerPushTokenAction({
        token: event.value,
        platform: platform === "ios" || platform === "android" ? platform : "web",
      });
    } catch {
      /* silent */
    }
  });

  const handleErr = await PushNotifications.addListener("registrationError", () => undefined);

  return () => {
    void handleReg.remove();
    void handleErr.remove();
  };
}

/**
 * Request permission and register with APNs/FCM. Call after enabling push in settings
 * or on app start when push_enabled is already true.
 */
export async function registerNativePushIfPossible(): Promise<void> {
  if (!isNativeCapacitor()) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;
    await PushNotifications.register();
  } catch {
    /* silent */
  }
}

/**
 * Attach registration listeners and, if the user is logged in with push_enabled, register.
 * Returns cleanup for listeners (call on unmount).
 */
export async function setupNativePush(): Promise<() => void> {
  if (!isIOSCapacitor()) {
    return () => {};
  }

  const cleanup = await attachPushTokenListeners();

  void (async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notification_preferences")
        .select("push_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.push_enabled) {
        await registerNativePushIfPossible();
      }
    } catch {
      /* silent */
    }
  })();

  return cleanup;
}
