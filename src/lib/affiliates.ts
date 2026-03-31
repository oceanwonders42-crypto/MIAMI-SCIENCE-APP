import type { SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateProfile, AffiliateStatsCache } from "@/types";

export async function getAffiliateProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<AffiliateProfile | null> {
  const { data, error } = await supabase
    .from("affiliate_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return data as AffiliateProfile | null;
}

export async function getAffiliateProfileById(
  supabase: SupabaseClient,
  profileId: string
): Promise<AffiliateProfile | null> {
  const { data, error } = await supabase
    .from("affiliate_profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error) return null;
  return data as AffiliateProfile | null;
}

/**
 * Latest stats from cache (e.g. period = 'all' or current month).
 * When SliceWP sync is enabled, this will be populated by sync job.
 */
export async function getAffiliateStats(
  supabase: SupabaseClient,
  userId: string,
  options?: { period?: string }
): Promise<AffiliateStatsCache | null> {
  let q = supabase.from("affiliate_stats_cache").select("*").eq("user_id", userId);
  if (options?.period) {
    q = q.eq("period", options.period);
  }
  const { data, error } = await q
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as AffiliateStatsCache | null;
}

/**
 * Build referral URL from profile and base URL.
 * Uses referral_link if set, otherwise baseUrl + ?ref=referral_code.
 */
export function buildReferralLink(
  profile: AffiliateProfile | null,
  baseUrl: string
): string {
  if (!profile) return baseUrl;
  const link = profile.referral_link?.trim();
  if (link) return link;
  const base = baseUrl.replace(/\/$/, "");
  const code = profile.referral_code?.trim();
  if (!code) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}ref=${encodeURIComponent(code)}`;
}

export function formatCommissionCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export type AffiliateProfileInsert = {
  user_id: string;
  referral_code: string;
  coupon_code?: string | null;
  referral_link?: string | null;
  payout_status?: string | null;
  slicewp_affiliate_id?: string | null;
  status?: "active" | "paused" | "suspended";
};

export async function createAffiliateProfile(
  supabase: SupabaseClient,
  insert: AffiliateProfileInsert
): Promise<{ data: AffiliateProfile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("affiliate_profiles")
    .insert({
      ...insert,
      status: insert.status ?? "active",
    })
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as AffiliateProfile, error: null };
}

export type AffiliateProfileUpdate = Partial<
  Pick<
    AffiliateProfile,
    | "referral_code"
    | "coupon_code"
    | "referral_link"
    | "payout_status"
    | "payout_method"
    | "payout_details"
    | "status"
    | "slicewp_affiliate_id"
    | "affiliate_external_synced_at"
    | "affiliate_external_sync_error"
    | "woo_coupon_id"
    | "coupon_discount_percent"
    | "commission_percent"
  >
>;

export async function updateAffiliateProfile(
  supabase: SupabaseClient,
  profileId: string,
  update: AffiliateProfileUpdate
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("affiliate_profiles")
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  return { error: error ? new Error(error.message) : null };
}

/** Update payout fields on the row belonging to the user (RLS). */
export async function updateAffiliatePayoutByUserId(
  supabase: SupabaseClient,
  userId: string,
  payout: { payout_method: string; payout_details: Record<string, unknown> }
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("affiliate_profiles")
    .update({
      payout_method: payout.payout_method,
      payout_details: payout.payout_details,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  return { error: error ? new Error(error.message) : null };
}

export async function getAllAffiliateProfiles(
  supabase: SupabaseClient
): Promise<AffiliateProfile[]> {
  const { data, error } = await supabase
    .from("affiliate_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as AffiliateProfile[];
}
