import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";
import { getAffiliateProfile } from "@/lib/affiliates";

/** Public unlock code for SliceWP + Woo onboarding (server-verified only). */
export const AFFILIATE_UNLOCK_CODE = "ULTRA";

const PROMO_MAX_LEN = 40;

/**
 * Normalize user-entered promo: uppercase alphanumeric + hyphen/underscore; no spaces.
 */
export function normalizeAffiliatePromoCode(
  raw: string
): { ok: true; code: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Enter a promo code." };
  if (trimmed.length > PROMO_MAX_LEN) {
    return { ok: false, error: `Promo code must be at most ${PROMO_MAX_LEN} characters.` };
  }
  const upper = trimmed.toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(upper)) {
    return {
      ok: false,
      error: "Use letters, numbers, hyphen, or underscore only.",
    };
  }
  return { ok: true, code: upper };
}

export function isAffiliateUnlockCodeValid(code: string | null | undefined): boolean {
  return (code ?? "").trim().toUpperCase() === AFFILIATE_UNLOCK_CODE;
}

export type AffiliateDashboardAccess =
  | { kind: "full"; reason: "admin" | "slicewp_linked" }
  | {
      kind: "locked";
      reason: "customer_no_slice" | "pending_unlock_onboarding";
    };

/**
 * Backend source of truth for affiliate tab: admins always full; others need a persisted SliceWP id.
 * user_roles.affiliate alone is not sufficient (no client/UI faking).
 */
export async function resolveAffiliateDashboardAccess(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<AffiliateDashboardAccess> {
  if (role === "admin") {
    return { kind: "full", reason: "admin" };
  }

  const profile = await getAffiliateProfile(supabase, userId);
  const sliceId = profile?.slicewp_affiliate_id?.trim();
  if (sliceId) {
    return { kind: "full", reason: "slicewp_linked" };
  }

  return { kind: "locked", reason: "customer_no_slice" };
}

export function suggestAlternatePromoCode(base: string): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  const prefix = base.replace(/[^A-Z0-9_-]/gi, "").slice(0, 12).toUpperCase() || "PROMO";
  return `${prefix}-${n}`;
}
