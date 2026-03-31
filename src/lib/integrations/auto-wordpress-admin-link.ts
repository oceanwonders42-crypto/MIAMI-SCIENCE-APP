import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCustomersSearch, getWooCommerceConfig } from "@/lib/integrations/woocommerce-client";
import { normalizeEmail } from "@/lib/customer-mapping";
import { isSuperadminEmail } from "@/lib/superadmin-emails";
import {
  ensureAppAdminRole,
  getWordPressLinkByUserId,
  upsertWordPressUserLink,
} from "@/lib/wordpress-user-link";

type AutoWordPressAdminLinkResult =
  | { ok: true; promoted: boolean; reason: "already_admin_linked" | "linked_and_promoted" | "linked_non_admin" }
  | {
      ok: false;
      reason:
        | "no_email"
        | "not_configured"
        | "fetch_error"
        | "no_match"
        | "multiple_matches"
        | "invalid_wordpress_id"
        | "link_error"
        | "role_error";
      error?: string;
    };

const WORDPRESS_ADMIN_ROLES = new Set(["administrator", "shop_manager"]);

function normalizeRole(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const v = input.trim().toLowerCase();
  return v ? v : null;
}

/**
 * Durable admin linking flow:
 * 1) If an existing WordPress link row marks the user as wp-admin, ensure app admin role.
 * 2) Else reconcile by exact normalized email one time against Woo customers.
 * 3) Persist stable wordpress_user_id link and wp role; promote only when external role is admin/shop_manager.
 */
export async function tryAutoLinkWordPressAdmin(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<AutoWordPressAdminLinkResult> {
  const normalizedEmail = normalizeEmail(userEmail);
  if (!normalizedEmail) return { ok: false, reason: "no_email" };

  if (isSuperadminEmail(normalizedEmail)) {
    const roleRes = await ensureAppAdminRole(supabase, userId);
    if (!roleRes.ok) return { ok: false, reason: "role_error", error: roleRes.error };
  }

  const existing = await getWordPressLinkByUserId(supabase, userId);
  if (existing?.is_wordpress_admin) {
    const roleRes = await ensureAppAdminRole(supabase, userId);
    if (!roleRes.ok) return { ok: false, reason: "role_error", error: roleRes.error };
    return { ok: true, promoted: true, reason: "already_admin_linked" };
  }

  const config = getWooCommerceConfig();
  if (!config) return { ok: false, reason: "not_configured" };

  const searchResult = await fetchCustomersSearch(config, normalizedEmail, { per_page: 100 });
  if (!searchResult.ok) {
    return { ok: false, reason: "fetch_error", error: searchResult.error };
  }

  const exact = (searchResult.data ?? []).filter(
    (row) => normalizeEmail(typeof row.email === "string" ? row.email : null) === normalizedEmail
  );
  if (exact.length === 0) return { ok: false, reason: "no_match" };
  if (exact.length > 1) return { ok: false, reason: "multiple_matches" };

  const candidate = exact[0]!;
  const wpId = typeof candidate.id === "number" ? candidate.id : parseInt(String(candidate.id), 10);
  if (!Number.isInteger(wpId) || wpId < 1) return { ok: false, reason: "invalid_wordpress_id" };

  const wpRole = normalizeRole(candidate.role);
  const isWpAdmin = wpRole != null && WORDPRESS_ADMIN_ROLES.has(wpRole);
  const linkRes = await upsertWordPressUserLink(supabase, {
    user_id: userId,
    wordpress_user_id: wpId,
    wordpress_email: normalizedEmail,
    wordpress_role: wpRole,
    is_wordpress_admin: isWpAdmin,
    match_source: "auto_email",
  });
  if (!linkRes.ok) return { ok: false, reason: "link_error", error: linkRes.error };

  if (!isWpAdmin) return { ok: true, promoted: false, reason: "linked_non_admin" };

  const roleRes = await ensureAppAdminRole(supabase, userId);
  if (!roleRes.ok) return { ok: false, reason: "role_error", error: roleRes.error };

  return { ok: true, promoted: true, reason: "linked_and_promoted" };
}
