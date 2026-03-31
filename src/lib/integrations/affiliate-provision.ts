/**
 * ULTRA onboarding: create SliceWP affiliate + Woo coupon + app profile (service-role only).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WooCommerceConfig } from "@/lib/integrations/woocommerce-client";
import {
  getWooCommerceConfig,
  createWooCommerceCoupon,
  deleteWooCommerceCoupon,
  fetchCouponsByCodeSearch,
  fetchCustomersSearch,
  pickCouponMatchingCode,
} from "@/lib/integrations/woocommerce-client";
import {
  createSliceWPAffiliate,
  updateSliceWPAffiliate,
  deleteSliceWPAffiliate,
  isSliceWPSyncEnabled,
} from "@/lib/integrations/slicewp";
import { getAffiliateProgramSettings } from "@/lib/affiliate-program-settings";
import {
  normalizeAffiliatePromoCode,
  hasCompletedAffiliateProgramOnboarding,
} from "@/lib/affiliate-access";
import { getAffiliateProfile } from "@/lib/affiliates";

export type ProvisionOnboardingResult =
  | { ok: true; slicewpAffiliateId: string; wooCouponId: number | null; promoCode: string }
  | { ok: false; error: string };

export async function checkAffiliatePromoCodeTaken(
  serviceSb: SupabaseClient,
  promoCodeNormalized: string
): Promise<{ taken: true; reason: "app" | "woocommerce" } | { taken: false }> {
  const { data: row } = await serviceSb
    .from("affiliate_profiles")
    .select("id")
    .eq("coupon_code", promoCodeNormalized)
    .maybeSingle();
  if (row) return { taken: true, reason: "app" };

  const woo = getWooCommerceConfig();
  if (woo) {
    const res = await fetchCouponsByCodeSearch(woo, promoCodeNormalized);
    if (res.ok && pickCouponMatchingCode(res.data ?? [], promoCodeNormalized)) {
      return { taken: true, reason: "woocommerce" };
    }
  }

  return { taken: false };
}

/** SliceWP create requires a WordPress user; Woo customer id matches WP user id for registered customers. */
async function resolveWooCustomerWordPressUserId(
  woo: WooCommerceConfig,
  email: string
): Promise<number | null> {
  const em = email.trim().toLowerCase();
  const res = await fetchCustomersSearch(woo, em, { per_page: 20, page: 1 });
  if (!res.ok || !res.data?.length) return null;
  for (const c of res.data) {
    if (String(c.email ?? "").trim().toLowerCase() === em) return c.id;
  }
  return null;
}

function buildSliceCreatePayloadFull(
  email: string,
  commission: number,
  couponCode: string,
  wpUserId: number | null
): Record<string, unknown> {
  const em = email.trim().toLowerCase();
  const o: Record<string, unknown> = {
    email: em,
    user_email: em,
    payment_email: em,
    status: "active",
    commission_rate: String(commission),
    commission: String(commission),
    coupon_code: couponCode,
  };
  if (wpUserId != null) o.user_id = wpUserId;
  return o;
}

function buildSliceCreatePayloadMinimal(email: string, wpUserId: number | null): Record<string, unknown> {
  const em = email.trim().toLowerCase();
  const o: Record<string, unknown> = {
    email: em,
    user_email: em,
    payment_email: em,
    status: "active",
  };
  if (wpUserId != null) o.user_id = wpUserId;
  return o;
}

async function resolveSliceCreate(
  email: string,
  commission: number,
  couponCode: string,
  woo: WooCommerceConfig
): Promise<{ id: string } | { error: string }> {
  const wpUserId = await resolveWooCustomerWordPressUserId(woo, email);
  const full = await createSliceWPAffiliate(
    buildSliceCreatePayloadFull(email, commission, couponCode, wpUserId)
  );
  if ("id" in full && full.id) return { id: full.id };
  const fullErr = "error" in full ? full.error : "SliceWP create failed";

  const minimal = await createSliceWPAffiliate(buildSliceCreatePayloadMinimal(email, wpUserId));
  if (!("id" in minimal) || !minimal.id) {
    const msg = "error" in minimal ? minimal.error : fullErr;
    return { error: msg };
  }
  const id = minimal.id;
  const em = email.trim().toLowerCase();
  const patch = await updateSliceWPAffiliate(id, {
    payment_email: em,
    coupon_code: couponCode,
    commission_rate: String(commission),
    commission: String(commission),
  });
  if ("error" in patch) {
    await deleteSliceWPAffiliate(id);
    return { error: patch.error };
  }
  return { id };
}

export async function provisionAffiliateViaOnboarding(options: {
  serviceSb: SupabaseClient;
  userId: string;
  email: string;
  promoCodeRaw: string;
}): Promise<ProvisionOnboardingResult> {
  const norm = normalizeAffiliatePromoCode(options.promoCodeRaw);
  if (!norm.ok) return { ok: false, error: norm.error };

  if (!options.email?.trim()) {
    return { ok: false, error: "Your account needs an email to create an affiliate profile." };
  }

  if (!isSliceWPSyncEnabled()) {
    return { ok: false, error: "Affiliate onboarding requires SliceWP (API) to be configured." };
  }

  const woo = getWooCommerceConfig();
  if (!woo) {
    return { ok: false, error: "Affiliate onboarding requires WooCommerce REST credentials." };
  }

  const taken = await checkAffiliatePromoCodeTaken(options.serviceSb, norm.code);
  if (taken.taken) {
    return {
      ok: false,
      error:
        taken.reason === "woocommerce"
          ? "That code is already used in the store. Choose a different code."
          : "That code is already assigned to another affiliate.",
    };
  }

  const existingProfile = await getAffiliateProfile(options.serviceSb, options.userId);
  if (hasCompletedAffiliateProgramOnboarding(existingProfile)) {
    return { ok: false, error: "Your account is already linked as an affiliate." };
  }

  const settings = await getAffiliateProgramSettings(options.serviceSb);
  const discount = Number(settings.default_coupon_discount_percent);
  const commission = Number(settings.default_commission_percent);

  const existingSliceId = existingProfile?.slicewp_affiliate_id?.trim() ?? "";
  const needsWooCoupon =
    !existingProfile ||
    existingProfile.woo_coupon_id == null ||
    !Number.isFinite(Number(existingProfile.woo_coupon_id)) ||
    Number(existingProfile.woo_coupon_id) <= 0;

  if (existingSliceId && needsWooCoupon && existingProfile) {
    const sliceId = existingSliceId;
    const couponBody: Record<string, unknown> = {
      code: norm.code,
      discount_type: "percent",
      amount: String(discount),
      individual_use: false,
      exclude_sale_items: false,
      email_restrictions: [options.email.trim().toLowerCase()],
    };

    const wooRes = await createWooCommerceCoupon(woo, couponBody);
    if (!wooRes.ok) {
      const errSnippet = wooRes.error.slice(0, 280);
      return { ok: false, error: `WooCommerce coupon failed: ${errSnippet}` };
    }
    const wooId = wooRes.data.id;

    const sliceLink = await updateSliceWPAffiliate(sliceId, {
      payment_email: options.email.trim().toLowerCase(),
      coupon_code: norm.code,
      commission_rate: String(commission),
      commission: String(commission),
    });
    if ("error" in sliceLink) {
      await deleteWooCommerceCoupon(woo, wooId);
      return { ok: false, error: `SliceWP coupon link failed: ${sliceLink.error}` };
    }

    const referralCode = norm.code;
    const nowIso = new Date().toISOString();

    const { error } = await options.serviceSb
      .from("affiliate_profiles")
      .update({
        referral_code: referralCode,
        coupon_code: norm.code,
        slicewp_affiliate_id: sliceId,
        woo_coupon_id: wooId,
        coupon_discount_percent: discount,
        commission_percent: commission,
        affiliate_external_sync_error: null,
        affiliate_external_synced_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", existingProfile.id);
    if (error) {
      await deleteWooCommerceCoupon(woo, wooId);
      return { ok: false, error: error.message };
    }

    await options.serviceSb.from("user_roles").update({ role: "affiliate" }).eq("user_id", options.userId);

    await options.serviceSb.from("affiliate_onboarding_sessions").delete().eq("user_id", options.userId);

    return { ok: true, slicewpAffiliateId: sliceId, wooCouponId: wooId, promoCode: norm.code };
  }

  const slice = await resolveSliceCreate(options.email, commission, norm.code, woo);
  if ("error" in slice) {
    return { ok: false, error: `SliceWP: ${slice.error}` };
  }
  const sliceId = slice.id;

  const couponBody: Record<string, unknown> = {
    code: norm.code,
    discount_type: "percent",
    amount: String(discount),
    individual_use: false,
    exclude_sale_items: false,
    email_restrictions: [options.email.trim().toLowerCase()],
  };

  const wooRes = await createWooCommerceCoupon(woo, couponBody);
  if (!wooRes.ok) {
    await deleteSliceWPAffiliate(sliceId);
    const errSnippet = wooRes.error.slice(0, 280);
    return { ok: false, error: `WooCommerce coupon failed: ${errSnippet}` };
  }
  const wooId = wooRes.data.id;

  const sliceLink = await updateSliceWPAffiliate(sliceId, {
    payment_email: options.email.trim().toLowerCase(),
    coupon_code: norm.code,
    commission_rate: String(commission),
    commission: String(commission),
  });
  if ("error" in sliceLink) {
    await deleteWooCommerceCoupon(woo, wooId);
    await deleteSliceWPAffiliate(sliceId);
    return { ok: false, error: `SliceWP coupon link failed: ${sliceLink.error}` };
  }

  const referralCode = norm.code;
  const nowIso = new Date().toISOString();

  if (existingProfile) {
    const { error } = await options.serviceSb
      .from("affiliate_profiles")
      .update({
        referral_code: referralCode,
        coupon_code: norm.code,
        slicewp_affiliate_id: sliceId,
        woo_coupon_id: wooId,
        coupon_discount_percent: discount,
        commission_percent: commission,
        affiliate_external_sync_error: null,
        affiliate_external_synced_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", existingProfile.id);
    if (error) {
      await deleteWooCommerceCoupon(woo, wooId);
      await deleteSliceWPAffiliate(sliceId);
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await options.serviceSb.from("affiliate_profiles").insert({
      user_id: options.userId,
      referral_code: referralCode,
      coupon_code: norm.code,
      slicewp_affiliate_id: sliceId,
      woo_coupon_id: wooId,
      coupon_discount_percent: discount,
      commission_percent: commission,
      status: "active",
      affiliate_external_synced_at: nowIso,
      affiliate_external_sync_error: null,
    });
    if (error) {
      await deleteWooCommerceCoupon(woo, wooId);
      await deleteSliceWPAffiliate(sliceId);
      return { ok: false, error: error.message };
    }
  }

  await options.serviceSb.from("user_roles").update({ role: "affiliate" }).eq("user_id", options.userId);

  await options.serviceSb.from("affiliate_onboarding_sessions").delete().eq("user_id", options.userId);

  return { ok: true, slicewpAffiliateId: sliceId, wooCouponId: wooId, promoCode: norm.code };
}
