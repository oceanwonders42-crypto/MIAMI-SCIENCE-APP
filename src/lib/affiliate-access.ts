import type { SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateProfile, UserRole } from "@/types";
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
  | { kind: "full"; reason: "admin" | "onboarded" }
  | {
      kind: "locked";
      reason: "needs_onboarding";
    };

/**
 * App affiliate program unlocked only after ULTRA + promo provisioning (or equivalent admin setup):
 * SliceWP id, Woo coupon id, and promo code must all exist on the profile.
 * SliceWP email cross-reference alone must not unlock (see bootstrapAffiliateIdentityFromSliceEmail disabled).
 */
export function hasCompletedAffiliateProgramOnboarding(
  profile: AffiliateProfile | null
): boolean {
  if (!profile) return false;
  const slice = profile.slicewp_affiliate_id?.trim();
  const code = profile.coupon_code?.trim();
  const woo = profile.woo_coupon_id;
  if (!slice || !code) return false;
  if (woo == null || !Number.isFinite(Number(woo)) || Number(woo) <= 0) return false;
  return true;
}

/**
 * When true, it is safe to attach a SliceWP affiliate id from an email match during sync
 * (user already has app-issued promo + Woo coupon — e.g. repair missing slice id).
 */
export function hasAppAffiliateCouponPair(profile: AffiliateProfile | null): boolean {
  if (!profile) return false;
  const code = profile.coupon_code?.trim();
  const woo = profile.woo_coupon_id;
  return Boolean(
    code && woo != null && Number.isFinite(Number(woo)) && Number(woo) > 0
  );
}

/**
 * Backend source of truth for the Affiliate tab: admins always full; others only after
 * completed onboarding (not role alone, not SliceWP id alone).
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
  if (hasCompletedAffiliateProgramOnboarding(profile)) {
    return { kind: "full", reason: "onboarded" };
  }

  return { kind: "locked", reason: "needs_onboarding" };
}

export function suggestAlternatePromoCode(base: string): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  const prefix = base.replace(/[^A-Z0-9_-]/gi, "").slice(0, 12).toUpperCase() || "PROMO";
  return `${prefix}-${n}`;
}
