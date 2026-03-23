import type { SupabaseClient } from "@supabase/supabase-js";

export type PushPlatform = "ios" | "android" | "web";

/**
 * Upsert device token for (user_id, platform). Use the logged-in user's Supabase client (RLS).
 */
export async function upsertPushTokenForUser(
  supabase: SupabaseClient,
  userId: string,
  token: string,
  platform: PushPlatform
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = token.trim();
  if (!t) return { ok: false, error: "Empty token" };

  const now = new Date().toISOString();
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      token: t,
      platform,
      updated_at: now,
    },
    { onConflict: "user_id,platform" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function normalizePlatform(p?: string): PushPlatform {
  const x = (p ?? "web").toLowerCase();
  if (x === "ios" || x === "android" || x === "web") return x;
  return "web";
}

/**
 * @deprecated Use upsertPushTokenForUser — same behavior (upsert).
 */
export async function registerPushToken(
  supabase: SupabaseClient,
  userId: string,
  token: string,
  platform?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return upsertPushTokenForUser(supabase, userId, token, normalizePlatform(platform));
}
