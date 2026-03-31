import type { SupabaseClient } from "@supabase/supabase-js";

export interface WordPressUserLink {
  id: string;
  user_id: string;
  wordpress_user_id: number;
  wordpress_email: string;
  wordpress_role: string | null;
  is_wordpress_admin: boolean;
  match_source: "auto_email" | "woocommerce_customer" | "manual";
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export function normalizeWordPressEmail(email: string | null | undefined): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

export async function getWordPressLinkByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<WordPressUserLink | null> {
  const { data, error } = await supabase
    .from("wordpress_user_links")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as WordPressUserLink | null) ?? null;
}

export async function upsertWordPressUserLink(
  supabase: SupabaseClient,
  input: {
    user_id: string;
    wordpress_user_id: number;
    wordpress_email: string;
    wordpress_role: string | null;
    is_wordpress_admin: boolean;
    match_source: "auto_email" | "woocommerce_customer" | "manual";
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const wordpress_email = normalizeWordPressEmail(input.wordpress_email);
  if (!wordpress_email) return { ok: false, error: "wordpress_email required" };
  if (!Number.isInteger(input.wordpress_user_id) || input.wordpress_user_id < 1) {
    return { ok: false, error: "wordpress_user_id must be a positive integer" };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("wordpress_user_links").upsert(
    {
      user_id: input.user_id,
      wordpress_user_id: input.wordpress_user_id,
      wordpress_email,
      wordpress_role: input.wordpress_role,
      is_wordpress_admin: input.is_wordpress_admin,
      match_source: input.match_source,
      last_seen_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function ensureAppAdminRole(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role: "admin",
    },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
