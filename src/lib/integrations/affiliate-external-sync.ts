/**
 * WordPress / SliceWP / WooCommerce — affiliate identity + promo reconciliation (server-only).
 * WordPress + WooCommerce + SliceWP are source of truth; app mirrors coupon/referral with timestamps.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAffiliateProfile, buildReferralLink } from "@/lib/affiliates";
import type { AffiliateProfile } from "@/types";
import { normalizeEmail } from "@/lib/customer-mapping";
import {
  isSliceWPSyncEnabled,
  findSliceWPAffiliateIdsByEmail,
  resolveSliceWPAffiliateId,
  fetchSliceWPAffiliatePatch,
} from "@/lib/integrations/slicewp";
import { hasAppAffiliateCouponPair } from "@/lib/affiliate-access";
import {
  getWooCommerceConfig,
  fetchCouponsByCodeSearch,
  pickCouponMatchingCode,
  couponEmailRestrictionsAllow,
} from "@/lib/integrations/woocommerce-client";

/** Re-sync full promo path if older than this (ms). */
export const AFFILIATE_EXTERNAL_SYNC_STALE_MS = 5 * 60 * 1000;

export type PromoMismatchKind =
  | "none"
  | "woo_not_configured"
  | "coupon_not_in_woocommerce"
  | "email_restrictions"
  | "slice_missing_coupon";

/**
 * When Woo reports the coupon missing (or Slice has no code), do not surface a code in the UI
 * even if the DB mirror still has an old value.
 */
export function affiliatePromoCodeDisplayAllowed(
  promoFromSlice: string | null | undefined,
  mismatch: PromoMismatchKind
): string | null {
  const code = promoFromSlice?.trim() || null;
  if (!code) return null;
  if (mismatch === "slice_missing_coupon") return null;
  if (mismatch === "coupon_not_in_woocommerce") return null;
  return code;
}

/** True when a recent successful row exists and caller should not hit external APIs. */
export function isAffiliateExternalSyncFresh(
  profile: AffiliateProfile,
  force: boolean
): boolean {
  if (force) return false;
  if (profile.affiliate_external_sync_error?.trim()) return false;
  const syncedAt = profile.affiliate_external_synced_at;
  if (!syncedAt) return false;
  return Date.now() - new Date(syncedAt).getTime() < AFFILIATE_EXTERNAL_SYNC_STALE_MS;
}

export type AffiliateExternalSyncPresentation = {
  slicewpAffiliateId: string | null;
  promoCodeDisplay: string | null;
  referralLink: string;
  payoutStatus: string | null;
  affiliateStatus: string | null;
  mismatch: PromoMismatchKind;
  syncError: string | null;
  lastExternalSyncedAt: string | null;
  wooCouponId: number | null;
  sliceAffiliateEmail: string | null;
  appEmail: string | null;
  emailMismatchWithSlice: boolean;
};

async function updateAffiliateProfileRow(
  supabase: SupabaseClient,
  profileId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("affiliate_profiles")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (error) {
    console.error("[affiliate-external-sync] profile update failed:", error.message);
  }
}

/**
 * If SliceWP id is missing, persist a single email match. Multiple matches → error for admin.
 */
export async function persistSliceAffiliateIdIfUniqueEmailMatch(
  supabase: SupabaseClient,
  userEmail: string | null | undefined,
  profile: AffiliateProfile
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isSliceWPSyncEnabled()) return { ok: false, reason: "slice_disabled" };
  if (profile.slicewp_affiliate_id?.trim()) return { ok: true };
  if (!hasAppAffiliateCouponPair(profile)) {
    return { ok: false, reason: "no_app_coupon_pair" };
  }

  const { ids, apiError } = await findSliceWPAffiliateIdsByEmail(userEmail);
  if (apiError) {
    await updateAffiliateProfileRow(supabase, profile.id, {
      affiliate_external_sync_error: apiError,
    });
    return { ok: false, reason: apiError };
  }
  if (ids.length === 0) return { ok: false, reason: "no_email_match" };
  if (ids.length > 1) {
    const msg =
      "Multiple SliceWP affiliates share this login email. An admin must set the correct SliceWP affiliate ID on your profile.";
    await updateAffiliateProfileRow(supabase, profile.id, {
      affiliate_external_sync_error: msg,
    });
    return { ok: false, reason: "ambiguous_email" };
  }

  const sliceId = ids[0]!;
  const { error } = await supabase
    .from("affiliate_profiles")
    .update({
      slicewp_affiliate_id: sliceId,
      affiliate_external_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate")) {
      const msg = "This SliceWP affiliate is already linked to another app account.";
      await updateAffiliateProfileRow(supabase, profile.id, {
        affiliate_external_sync_error: msg,
      });
      return { ok: false, reason: msg };
    }
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}

function presentationFromProfile(
  p: AffiliateProfile,
  baseUrl: string,
  extras: Partial<AffiliateExternalSyncPresentation> = {}
): AffiliateExternalSyncPresentation {
  return {
    slicewpAffiliateId: p.slicewp_affiliate_id?.trim() ?? null,
    promoCodeDisplay: p.coupon_code?.trim() || null,
    referralLink: buildReferralLink(p, baseUrl),
    payoutStatus: p.payout_status,
    affiliateStatus: p.status,
    mismatch: "none",
    syncError: p.affiliate_external_sync_error ?? null,
    lastExternalSyncedAt: p.affiliate_external_synced_at ?? null,
    wooCouponId: p.woo_coupon_id ?? null,
    sliceAffiliateEmail: null,
    appEmail: null,
    emailMismatchWithSlice: false,
    ...extras,
  };
}

/**
 * Reconcile SliceWP affiliate id, coupon code, referral link, and (when Woo is configured) verify coupon in WC REST.
 */
export async function runAffiliateExternalSync(options: {
  supabase: SupabaseClient;
  userId: string;
  baseUrl: string;
  force?: boolean;
}): Promise<AffiliateExternalSyncPresentation> {
  const {
    data: { user },
  } = await options.supabase.auth.getUser();
  const appEmail = user?.email?.trim() ?? null;

  const profile = await getAffiliateProfile(options.supabase, options.userId);
  if (!profile) {
    return {
      slicewpAffiliateId: null,
      promoCodeDisplay: null,
      referralLink: options.baseUrl,
      payoutStatus: null,
      affiliateStatus: null,
      mismatch: "none",
      syncError: "No affiliate profile in app",
      lastExternalSyncedAt: null,
      wooCouponId: null,
      sliceAffiliateEmail: null,
      appEmail,
      emailMismatchWithSlice: false,
    };
  }

  const basePres = presentationFromProfile(profile, options.baseUrl, { appEmail });

  if (!isSliceWPSyncEnabled()) {
    return {
      ...basePres,
      syncError: "SliceWP sync is not configured (set SLICEWP_SYNC_ENABLED and API credentials).",
    };
  }

  const stale = isAffiliateExternalSyncFresh(profile, Boolean(options.force));

  if (stale) {
    const sid =
      profile.slicewp_affiliate_id?.trim() ??
      (await resolveSliceWPAffiliateId({
        storedId: null,
        userEmail: appEmail,
      }));
    return {
      ...basePres,
      slicewpAffiliateId: sid,
      promoCodeDisplay: profile.coupon_code?.trim() || null,
      referralLink: buildReferralLink(profile, options.baseUrl),
      syncError: profile.affiliate_external_sync_error ?? null,
    };
  }

  await persistSliceAffiliateIdIfUniqueEmailMatch(options.supabase, appEmail, profile);

  const p = (await getAffiliateProfile(options.supabase, options.userId)) ?? profile;

  const sliceId =
    p.slicewp_affiliate_id?.trim() ||
    (await resolveSliceWPAffiliateId({
      storedId: p.slicewp_affiliate_id,
      userEmail: appEmail,
    }));

  if (!sliceId) {
    const msg =
      "Could not link to SliceWP (no slicewp_affiliate_id and no single email match). Contact admin.";
    await updateAffiliateProfileRow(options.supabase, p.id, {
      affiliate_external_sync_error: msg,
    });
    return {
      ...presentationFromProfile(p, options.baseUrl, { appEmail }),
      syncError: msg,
    };
  }

  const patch = await fetchSliceWPAffiliatePatch(sliceId);
  if (!patch) {
    const msg =
      "SliceWP affiliate API returned no data (check affiliate id and REST API permissions).";
    await updateAffiliateProfileRow(options.supabase, p.id, {
      affiliate_external_sync_error: msg,
    });
    return {
      ...presentationFromProfile(p, options.baseUrl, {
        appEmail,
        slicewpAffiliateId: sliceId,
      }),
      syncError: msg,
    };
  }

  const sliceEmail = patch.affiliateEmail?.trim() ?? null;
  const emailMismatch =
    Boolean(
      appEmail &&
        sliceEmail &&
        normalizeEmail(appEmail) !== normalizeEmail(sliceEmail)
    );

  let mismatch: PromoMismatchKind = "none";
  const problems: string[] = [];
  if (emailMismatch) {
    problems.push(
      `SliceWP affiliate email (${sliceEmail ?? "?"}) differs from your app login email (${appEmail ?? "?"}). Ask admin to align accounts.`
    );
  }

  const promoCode = patch.couponCode?.trim() || null;
  const referralLink =
    patch.referralLink?.trim() || buildReferralLink(p, options.baseUrl);
  const payoutStatus = patch.payoutStatus?.trim() || p.payout_status;

  if (!promoCode) {
    mismatch = "slice_missing_coupon";
    problems.push(
      "No coupon code on your SliceWP affiliate record. Configure Affiliate Coupons in WordPress."
    );
  }

  let wooCouponId: number | null = null;
  const wooConfig = getWooCommerceConfig();

  if (promoCode && wooConfig) {
    const wcRes = await fetchCouponsByCodeSearch(wooConfig, promoCode);
    if (!wcRes.ok) {
      mismatch = "coupon_not_in_woocommerce";
      problems.push(`WooCommerce coupon lookup failed: ${wcRes.error}`);
    } else {
      const coupon = pickCouponMatchingCode(wcRes.data ?? [], promoCode);
      if (!coupon) {
        mismatch = "coupon_not_in_woocommerce";
        problems.push(
          "Coupon code from SliceWP was not found in WooCommerce (check Affiliate Coupons linkage)."
        );
      } else {
        wooCouponId = coupon.id;
        const checkEmail = sliceEmail || appEmail;
        const emailGate = couponEmailRestrictionsAllow(
          coupon.email_restrictions,
          checkEmail
        );
        if (!emailGate.ok) {
          mismatch = "email_restrictions";
          problems.push(
            emailGate.reason === "missing_affiliate_email"
              ? "WooCommerce coupon has email restrictions but affiliate email is missing in SliceWP."
              : "WooCommerce coupon Allowed Emails do not include this affiliate email."
          );
        }
      }
    }
  } else if (promoCode && !wooConfig) {
    mismatch = "woo_not_configured";
    problems.push(
      "WooCommerce REST is not configured; coupon code is shown from SliceWP only (not verified in WooCommerce)."
    );
  }

  const nowIso = new Date().toISOString();
  const syncError = problems.length > 0 ? problems.join(" ") : null;

  await options.supabase
    .from("affiliate_profiles")
    .update({
      coupon_code: promoCode ?? p.coupon_code,
      referral_link: referralLink,
      payout_status: payoutStatus,
      woo_coupon_id: wooCouponId,
      affiliate_external_synced_at: nowIso,
      affiliate_external_sync_error: syncError,
      updated_at: nowIso,
    })
    .eq("id", p.id);

  const refreshed = (await getAffiliateProfile(options.supabase, options.userId)) ?? p;
  const displayCode = affiliatePromoCodeDisplayAllowed(promoCode, mismatch);

  return {
    slicewpAffiliateId: sliceId,
    promoCodeDisplay: displayCode,
    referralLink,
    payoutStatus,
    affiliateStatus: refreshed.status,
    mismatch,
    syncError,
    lastExternalSyncedAt: nowIso,
    wooCouponId,
    sliceAffiliateEmail: sliceEmail,
    appEmail,
    emailMismatchWithSlice: emailMismatch,
  };
}
