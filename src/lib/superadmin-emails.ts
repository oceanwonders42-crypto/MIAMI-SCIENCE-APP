import { normalizeEmail } from "@/lib/customer-mapping";

/**
 * Emails that always receive `user_roles.role = admin` (all /admin tools, RLS, moderation),
 * independent of WordPress administrator / shop_manager.
 *
 * Additional addresses: comma-separated `APP_SUPERADMIN_EMAILS` (server-only).
 */
const DEFAULT_SUPERADMIN_EMAILS = new Set([
  normalizeEmail("m.i.a.sciences@gmail.com"),
  /** Dedicated App Review admin (seed: supabase/seed_apple_review_admin.sql). */
  normalizeEmail("apple.review@miascience.com"),
]);

function envSuperadminEmailSet(): Set<string> {
  const raw = process.env.APP_SUPERADMIN_EMAILS ?? "";
  const set = new Set<string>();
  for (const part of raw.split(",")) {
    const n = normalizeEmail(part);
    if (n) set.add(n);
  }
  return set;
}

export function isSuperadminEmail(email: string | null | undefined): boolean {
  const n = normalizeEmail(email);
  if (!n) return false;
  if (DEFAULT_SUPERADMIN_EMAILS.has(n)) return true;
  return envSuperadminEmailSet().has(n);
}
