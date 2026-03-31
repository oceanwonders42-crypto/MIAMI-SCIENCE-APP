/**
 * Link app users to SliceWP by email and persist slicewp_affiliate_id (service role).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { UserRole } from "@/types";
import { getAffiliateProfile } from "@/lib/affiliates";
import { findSliceWPAffiliateIdsByEmail, isSliceWPSyncEnabled } from "@/lib/integrations/slicewp";
import { getAffiliateProgramSettings } from "@/lib/affiliate-program-settings";

export async function bootstrapAffiliateIdentityFromSliceEmail(
  serviceSb: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  role: UserRole
): Promise<void> {
  if (role === "admin") return;
  if (!email?.trim() || !isSliceWPSyncEnabled()) return;

  const profile = await getAffiliateProfile(serviceSb, userId);
  if (profile?.slicewp_affiliate_id?.trim()) {
    if (role !== "affiliate") {
      await serviceSb.from("user_roles").update({ role: "affiliate" }).eq("user_id", userId);
    }
    return;
  }

  const { ids, apiError } = await findSliceWPAffiliateIdsByEmail(email);
  if (apiError || ids.length !== 1) return;

  const sliceId = ids[0]!;
  const settings = await getAffiliateProgramSettings(serviceSb);
  const nowIso = new Date().toISOString();

  if (profile) {
    const { error } = await serviceSb
      .from("affiliate_profiles")
      .update({
        slicewp_affiliate_id: sliceId,
        affiliate_external_sync_error: null,
        updated_at: nowIso,
      })
      .eq("id", profile.id);
    if (error) {
      if (error.code === "23505" || error.message.includes("duplicate")) return;
      console.error("[bootstrapAffiliateIdentityFromSliceEmail] update failed:", error.message);
      return;
    }
  } else {
    const referralCode = `ref-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const { error } = await serviceSb.from("affiliate_profiles").insert({
      user_id: userId,
      referral_code: referralCode,
      slicewp_affiliate_id: sliceId,
      coupon_discount_percent: settings.default_coupon_discount_percent,
      commission_percent: settings.default_commission_percent,
      status: "active",
      affiliate_external_sync_error: null,
    });
    if (error) {
      if (error.code === "23505" || error.message.includes("duplicate")) return;
      console.error("[bootstrapAffiliateIdentityFromSliceEmail] insert failed:", error.message);
      return;
    }
  }

  await serviceSb.from("user_roles").update({ role: "affiliate" }).eq("user_id", userId);
}
