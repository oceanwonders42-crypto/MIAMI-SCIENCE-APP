import type { SupabaseClient } from "@supabase/supabase-js";

const TABLE = "notification_preferences";

export interface NotificationPreferencesRow {
  reorder_reminders: boolean;
  comeback_reminders: boolean;
  weekly_recap: boolean;
  announcements: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
}

const DEFAULTS: NotificationPreferencesRow = {
  reorder_reminders: true,
  comeback_reminders: true,
  weekly_recap: true,
  announcements: true,
  email_enabled: true,
  push_enabled: false,
};

/**
 * Get notification preferences for a user. Returns defaults when no row exists.
 */
export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferencesRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("reorder_reminders, comeback_reminders, weekly_recap, announcements, email_enabled, push_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { ...DEFAULTS };
  return {
    reorder_reminders: data.reorder_reminders ?? DEFAULTS.reorder_reminders,
    comeback_reminders: data.comeback_reminders ?? DEFAULTS.comeback_reminders,
    weekly_recap: data.weekly_recap ?? DEFAULTS.weekly_recap,
    announcements: data.announcements ?? DEFAULTS.announcements,
    email_enabled: data.email_enabled ?? DEFAULTS.email_enabled,
    push_enabled: data.push_enabled ?? DEFAULTS.push_enabled,
  };
}

export type NotificationPreferencesUpdate = Partial<NotificationPreferencesRow>;

/** Fields the account UI may change — email on/off is not client-controlled (use unsubscribe link or re-enable). */
export type AccountNotificationPreferencesUpdate = Partial<
  Pick<
    NotificationPreferencesRow,
    "reorder_reminders" | "comeback_reminders" | "weekly_recap" | "announcements" | "push_enabled"
  >
>;

/**
 * Update notification preferences from the signed-in account UI.
 * Does not accept `email_enabled` (cannot turn off email in-app; use email unsubscribe link).
 */
export async function updateNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
  update: AccountNotificationPreferencesUpdate
): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowed = [
    "reorder_reminders",
    "comeback_reminders",
    "weekly_recap",
    "announcements",
    "push_enabled",
  ] as const;
  const payload: Record<string, boolean> = {};
  for (const key of allowed) {
    if (update[key] !== undefined) payload[key] = update[key] as boolean;
  }
  if (Object.keys(payload).length === 0) return { ok: true };

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      ...payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Re-enable email delivery after the user previously unsubscribed via link.
 */
export async function reEnableEmailNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing } = await supabase.from(TABLE).select("user_id").eq("user_id", userId).maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from(TABLE)
      .update({ email_enabled: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const { error } = await supabase.from(TABLE).insert({
    user_id: userId,
    ...DEFAULTS,
    email_enabled: true,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
