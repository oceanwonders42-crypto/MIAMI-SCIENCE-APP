import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationLogType, NotificationLogChannel, NotificationLogStatus } from "@/types/database";

const TABLE = "notification_log";

export interface NotificationLogInsert {
  user_id: string;
  notification_type: NotificationLogType;
  channel: NotificationLogChannel;
  status: NotificationLogStatus;
  reason?: string | null;
  sent_at?: string | null;
}

/**
 * Insert a notification log row. Use service role from cron/runner (no RLS INSERT policy for normal users).
 */
export async function insertNotificationLog(
  supabase: SupabaseClient,
  row: NotificationLogInsert
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from(TABLE).insert({
    user_id: row.user_id,
    notification_type: row.notification_type,
    channel: row.channel,
    status: row.status,
    reason: row.reason ?? null,
    sent_at: row.sent_at ?? (row.status === "sent" ? new Date().toISOString() : null),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface NotificationLogEntry {
  id: string;
  user_id: string;
  notification_type: string;
  channel: string;
  status: string;
  reason: string | null;
  sent_at: string | null;
  created_at: string;
}

/**
 * Get recent notification log entries (admin view). Requires admin role (RLS).
 */
export async function getRecentNotificationLogs(
  supabase: SupabaseClient,
  limit = 100
): Promise<NotificationLogEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, notification_type, channel, status, reason, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as NotificationLogEntry[];
}

export interface NotificationLogSummary {
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * Get counts of notification log entries since a given time (admin view). For "last 24h" summary.
 */
export async function getNotificationLogSummary(
  supabase: SupabaseClient,
  since: string
): Promise<NotificationLogSummary> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("status")
    .gte("created_at", since);
  if (error) return { sent: 0, failed: 0, skipped: 0 };
  const rows = data ?? [];
  return {
    sent: rows.filter((r) => r.status === "sent").length,
    failed: rows.filter((r) => r.status === "failed").length,
    skipped: rows.filter((r) => r.status === "skipped").length,
  };
}

/**
 * Get recent failed notification log entries (admin view). Requires admin role (RLS).
 */
export async function getRecentFailedLogs(
  supabase: SupabaseClient,
  limit = 20
): Promise<NotificationLogEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, notification_type, channel, status, reason, sent_at, created_at")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as NotificationLogEntry[];
}

/**
 * Check if the user has received a weekly_recap with status=sent in the current week (UTC).
 * Used for throttling.
 */
export async function hasReceivedWeeklyRecapThisWeek(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const startOfWeek = getStartOfWeekUTC();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("notification_type", "weekly_recap")
    .eq("status", "sent")
    .gte("sent_at", startOfWeek)
    .limit(1)
    .maybeSingle();
  if (error) return true;
  return data != null;
}

function getStartOfWeekUTC(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

/**
 * True if a notification of this type was successfully sent on push channel since `sinceIso`.
 */
export async function hasRecentPushNotification(
  supabase: SupabaseClient,
  userId: string,
  notificationType: string,
  sinceIso: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("notification_type", notificationType)
    .eq("channel", "push")
    .eq("status", "sent")
    .gte("sent_at", sinceIso)
    .limit(1)
    .maybeSingle();
  if (error) return true;
  return data != null;
}
