/**
 * Email unsubscribe tokens: issued per user, validated via public GET /api/unsubscribe (no login).
 * Server-only — uses service role or bypasses RLS where needed.
 */
import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appendUnsubscribeFooter } from "./email-templates";

const TABLE = "notification_preferences";

export function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Ensure the user has a stable unsubscribe token (for email footers). Creates/updates prefs row as needed.
 */
export async function ensureEmailUnsubscribeToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: row, error: selErr } = await supabase
    .from(TABLE)
    .select("email_unsubscribe_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (selErr) return null;

  if (row?.email_unsubscribe_token) {
    return row.email_unsubscribe_token as string;
  }

  const token = generateUnsubscribeToken();

  if (!row) {
    const { error: insErr } = await supabase.from(TABLE).insert({
      user_id: userId,
      email_unsubscribe_token: token,
      updated_at: new Date().toISOString(),
    });
    if (insErr) return null;
    return token;
  }

  const { error: updErr } = await supabase
    .from(TABLE)
    .update({ email_unsubscribe_token: token, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (updErr) return null;
  return token;
}

function publicAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export function buildUnsubscribeActionUrl(token: string): string | null {
  const base = publicAppBaseUrl();
  if (!base) return null;
  const u = new URL("/api/unsubscribe", `${base}/`);
  u.searchParams.set("t", token);
  return u.toString();
}

/**
 * Append one-click unsubscribe footer to a full HTML document from email templates.
 */
export async function withNotificationEmailFooter(
  supabase: SupabaseClient,
  userId: string,
  html: string
): Promise<string> {
  const token = await ensureEmailUnsubscribeToken(supabase, userId);
  if (!token) return html;
  const actionUrl = buildUnsubscribeActionUrl(token);
  if (!actionUrl) return html;
  return appendUnsubscribeFooter(html, actionUrl);
}

export type UnsubscribeByTokenResult = "ok" | "invalid" | "error";

/**
 * Mark email notifications disabled for the user owning this token (legal one-click unsubscribe).
 */
export async function unsubscribeEmailByToken(
  supabase: SupabaseClient,
  token: string
): Promise<UnsubscribeByTokenResult> {
  const trimmed = token?.trim() ?? "";
  if (trimmed.length < 16) return "invalid";

  const { data: row, error } = await supabase
    .from(TABLE)
    .select("user_id")
    .eq("email_unsubscribe_token", trimmed)
    .maybeSingle();

  if (error) return "error";
  if (!row?.user_id) return "invalid";

  const { error: upErr } = await supabase
    .from(TABLE)
    .update({
      email_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", row.user_id);

  if (upErr) return "error";
  return "ok";
}
