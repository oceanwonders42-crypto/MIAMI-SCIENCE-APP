import type { SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateProgramSettings } from "@/types";

const FALLBACK: AffiliateProgramSettings = {
  id: 1,
  default_coupon_discount_percent: 10,
  default_commission_percent: 15,
  updated_at: new Date().toISOString(),
};

export async function getAffiliateProgramSettings(
  supabase: SupabaseClient
): Promise<AffiliateProgramSettings> {
  const { data, error } = await supabase
    .from("affiliate_program_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return FALLBACK;
  return data as AffiliateProgramSettings;
}

export function effectiveAffiliateCouponDiscountPercent(
  profile: { coupon_discount_percent: number | null } | null | undefined,
  settings: Pick<AffiliateProgramSettings, "default_coupon_discount_percent">
): number {
  const p = profile?.coupon_discount_percent;
  if (p != null && !Number.isNaN(Number(p))) return Number(p);
  return Number(settings.default_coupon_discount_percent);
}

export function effectiveAffiliateCommissionPercent(
  profile: { commission_percent: number | null } | null | undefined,
  settings: Pick<AffiliateProgramSettings, "default_commission_percent">
): number {
  const p = profile?.commission_percent;
  if (p != null && !Number.isNaN(Number(p))) return Number(p);
  return Number(settings.default_commission_percent);
}
