/**
 * Push admin-edited affiliate coupon % and commission % to WooCommerce + SliceWP.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateProfile } from "@/types";
import {
  effectiveAffiliateCommissionPercent,
  effectiveAffiliateCouponDiscountPercent,
  getAffiliateProgramSettings,
} from "@/lib/affiliate-program-settings";
import { getWooCommerceConfig, updateWooCommerceCoupon } from "@/lib/integrations/woocommerce-client";
import { isSliceWPSyncEnabled, updateSliceWPAffiliate } from "@/lib/integrations/slicewp";

export async function pushAffiliatePricingToExternal(
  supabase: SupabaseClient,
  profile: AffiliateProfile
): Promise<{ ok: true } | { error: string }> {
  const settings = await getAffiliateProgramSettings(supabase);
  const discount = effectiveAffiliateCouponDiscountPercent(profile, settings);
  const commission = effectiveAffiliateCommissionPercent(profile, settings);

  const woo = getWooCommerceConfig();
  if (woo && profile.woo_coupon_id) {
    const r = await updateWooCommerceCoupon(woo, profile.woo_coupon_id, {
      discount_type: "percent",
      amount: String(discount),
    });
    if (!r.ok) {
      return { error: `WooCommerce: ${r.error.slice(0, 240)}` };
    }
  }

  const sliceId = profile.slicewp_affiliate_id?.trim();
  if (isSliceWPSyncEnabled() && sliceId) {
    const u = await updateSliceWPAffiliate(sliceId, {
      commission_rate: String(commission),
      commission: String(commission),
    });
    if ("error" in u) {
      return { error: `SliceWP: ${u.error}` };
    }
  }

  return { ok: true };
}
