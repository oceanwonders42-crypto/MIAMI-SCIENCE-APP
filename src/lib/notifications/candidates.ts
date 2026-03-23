import type { SupabaseClient } from "@supabase/supabase-js";
import { getAttentionItems, type AttentionType } from "@/lib/attention-items";
import { hasRecentPushNotification } from "@/lib/notification-log";

export interface NotificationCandidate {
  userId: string;
}

const REORDER_TYPES: AttentionType[] = ["overdue_reorder", "reorder_soon"];
const COMEBACK_TYPES: AttentionType[] = ["comeback_checkin", "comeback_workout"];

interface PrefsRow {
  reorder_reminders: boolean;
  comeback_reminders: boolean;
  weekly_recap: boolean;
  email_enabled: boolean;
}

const DEFAULTS: PrefsRow = {
  reorder_reminders: true,
  comeback_reminders: true,
  weekly_recap: true,
  email_enabled: true,
};

/**
 * Get user IDs with prefs allowing the given flags. Uses profiles + notification_preferences.
 */
async function getUsersWithPrefs(
  supabase: SupabaseClient,
  allow: (p: PrefsRow) => boolean
): Promise<string[]> {
  const { data: profiles } = await supabase.from("profiles").select("user_id");
  if (!profiles?.length) return [];
  const userIds = profiles.map((p) => p.user_id as string);

  const { data: prefsRows } = await supabase
    .from("notification_preferences")
    .select("user_id, reorder_reminders, comeback_reminders, weekly_recap, email_enabled");
  const prefsMap = new Map<string, PrefsRow>();
  for (const row of prefsRows ?? []) {
    prefsMap.set(row.user_id, {
      reorder_reminders: row.reorder_reminders ?? true,
      comeback_reminders: row.comeback_reminders ?? true,
      weekly_recap: row.weekly_recap ?? true,
      email_enabled: row.email_enabled ?? true,
    });
  }

  return userIds.filter((id) => {
    const p = prefsMap.get(id) ?? DEFAULTS;
    return allow(p);
  });
}

/**
 * Users who currently qualify for a reorder reminder email.
 * Respects notification preferences; reuses getAttentionItems.
 */
export async function getReorderReminderCandidates(
  supabase: SupabaseClient
): Promise<NotificationCandidate[]> {
  const userIds = await getUsersWithPrefs(supabase, (p) => p.reorder_reminders && p.email_enabled);
  const out: NotificationCandidate[] = [];
  for (const userId of userIds) {
    const items = await getAttentionItems(supabase, userId);
    const hasReorder = items.some((i) => REORDER_TYPES.includes(i.type));
    if (hasReorder) out.push({ userId });
  }
  return out;
}

/**
 * Users who currently qualify for a comeback reminder email.
 * Respects notification preferences; reuses getAttentionItems.
 */
export async function getComebackReminderCandidates(
  supabase: SupabaseClient
): Promise<NotificationCandidate[]> {
  const userIds = await getUsersWithPrefs(supabase, (p) => p.comeback_reminders && p.email_enabled);
  const out: NotificationCandidate[] = [];
  for (const userId of userIds) {
    const items = await getAttentionItems(supabase, userId);
    const hasComeback = items.some((i) => COMEBACK_TYPES.includes(i.type));
    if (hasComeback) out.push({ userId });
  }
  return out;
}

/**
 * Users eligible to receive the weekly recap (preference on, email on).
 * Caller is responsible for throttling (e.g. once per week per user).
 */
export async function getWeeklyRecapCandidates(
  supabase: SupabaseClient
): Promise<NotificationCandidate[]> {
  const ids = await getUsersWithPrefs(supabase, (p) => p.weekly_recap && p.email_enabled);
  return ids.map((userId) => ({ userId }));
}

const LOW_SUPPLY_PUSH_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Users with at least one supply at/below threshold, push on, reorder reminders on,
 * and no low_supply_alert push in the last 24h.
 */
export async function getLowSupplyPushCandidates(
  supabase: SupabaseClient
): Promise<NotificationCandidate[]> {
  const { data: supplies, error } = await supabase
    .from("supplies")
    .select("user_id, current_count, threshold_alert");
  if (error || !supplies?.length) return [];

  const lowUsers = new Set<string>();
  for (const row of supplies as {
    user_id: string;
    current_count: number;
    threshold_alert: number | null;
  }[]) {
    if (row.threshold_alert == null) continue;
    if (row.current_count <= row.threshold_alert) lowUsers.add(row.user_id);
  }
  if (lowUsers.size === 0) return [];

  const { data: prefsRows } = await supabase
    .from("notification_preferences")
    .select("user_id, push_enabled, reorder_reminders");
  const prefsMap = new Map<
    string,
    { push_enabled: boolean; reorder_reminders: boolean }
  >();
  for (const row of prefsRows ?? []) {
    prefsMap.set(row.user_id as string, {
      push_enabled: row.push_enabled === true,
      reorder_reminders: row.reorder_reminders !== false,
    });
  }

  const sinceIso = new Date(Date.now() - LOW_SUPPLY_PUSH_COOLDOWN_MS).toISOString();
  const out: NotificationCandidate[] = [];

  for (const userId of lowUsers) {
    const p = prefsMap.get(userId);
    const pushOk = p?.push_enabled === true;
    const reorderOk = p?.reorder_reminders !== false;
    if (!pushOk || !reorderOk) continue;
    const recent = await hasRecentPushNotification(supabase, userId, "low_supply_alert", sinceIso);
    if (recent) continue;
    out.push({ userId });
  }

  return out;
}
