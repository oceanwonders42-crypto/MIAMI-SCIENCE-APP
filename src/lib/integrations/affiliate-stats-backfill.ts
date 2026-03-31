/**
 * Idempotent SliceWP → affiliate_stats_cache backfill (service role).
 * Overwrites period "slice_sync" per user from current SliceWP commission totals — no per-order app ledger, so no double counting.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { syncSliceWPAffiliateStats, isSliceWPSyncEnabled } from "@/lib/integrations/slicewp";

export type AffiliateStatsBackfillResult = {
  profilesProcessed: number;
  profilesSkippedNoSliceId: number;
};

export async function backfillAffiliateStatsCacheFromSlice(
  serviceSb: SupabaseClient
): Promise<AffiliateStatsBackfillResult> {
  if (!isSliceWPSyncEnabled()) {
    return { profilesProcessed: 0, profilesSkippedNoSliceId: 0 };
  }

  const { data: rows, error } = await serviceSb
    .from("affiliate_profiles")
    .select("user_id, slicewp_affiliate_id")
    .not("slicewp_affiliate_id", "is", null);

  if (error || !rows?.length) {
    return {
      profilesProcessed: 0,
      profilesSkippedNoSliceId: error ? 0 : 0,
    };
  }

  let profilesProcessed = 0;
  let profilesSkippedNoSliceId = 0;

  for (const row of rows) {
    const uid = row.user_id as string | undefined;
    const sid = String(row.slicewp_affiliate_id ?? "").trim();
    if (!uid || !sid) {
      profilesSkippedNoSliceId += 1;
      continue;
    }
    await syncSliceWPAffiliateStats(serviceSb, uid, sid);
    profilesProcessed += 1;
  }

  return { profilesProcessed, profilesSkippedNoSliceId };
}
