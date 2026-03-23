"use server";

import { createServerClient } from "@/lib/supabase/server";
import { upsertPushTokenForUser, type PushPlatform } from "@/lib/notifications/push-tokens";
import {
  reEnableEmailNotifications,
  updateNotificationPreferences,
  type AccountNotificationPreferencesUpdate,
} from "@/lib/notification-preferences";
import { updateProfile } from "@/lib/profile";
import type { ExerciseImageVariant } from "@/types";
import { revalidatePath } from "next/cache";

export async function saveNotificationPreferences(
  update: AccountNotificationPreferencesUpdate
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  const result = await updateNotificationPreferences(supabase, user.id, update);
  if (!result.ok) {
    return { success: false, error: result.error };
  }
  revalidatePath("/account");
  return { success: true };
}

export async function reEnableEmailNotificationsAction(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  const result = await reEnableEmailNotifications(supabase, user.id);
  if (!result.ok) {
    return { success: false, error: result.error };
  }
  revalidatePath("/account");
  return { success: true };
}

/** Persist device token from Capacitor after user grants push permission. */
export async function registerPushTokenAction(input: {
  token: string;
  platform: PushPlatform;
}): Promise<{ ok: true } | { ok: false }> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false };
    const pf = input.platform;
    if (pf !== "ios" && pf !== "android" && pf !== "web") return { ok: false };
    const result = await upsertPushTokenForUser(supabase, user.id, input.token, pf);
    return result.ok ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function updateExerciseImageVariantAction(
  variant: ExerciseImageVariant
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }
  const { error } = await updateProfile(supabase, user.id, { exercise_image_variant: variant });
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/account");
  revalidatePath("/training");
  revalidatePath("/training/browse");
  return { success: true };
}
