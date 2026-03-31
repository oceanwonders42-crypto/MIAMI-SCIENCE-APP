/**
 * Admin-only SliceWP payout overview (pending / unpaid commissions per affiliate profile).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { SHOP_REFILL_URL } from "@/lib/constants";
import { getAllAffiliateProfiles } from "@/lib/affiliates";
import { getProfilesByUserIds } from "@/lib/profile";
import {
  fetchAllCommissionRowsForAffiliate,
  computeSliceWPCommissionMetrics,
  isSliceWPSyncEnabled,
} from "@/lib/integrations/slicewp";

export type AffiliatePayoutAdminRow = {
  userId: string;
  profileId: string;
  displayLabel: string;
  email: string | null;
  promoCode: string | null;
  sliceId: string;
  pendingPayoutCents: number;
  pendingPayoutRowCount: number;
  totalEarnedCents: number;
  referralCountAllTime: number;
  payoutStatus: string | null;
};

export function sliceWpPayoutsAdminUrl(): string {
  return `${SHOP_REFILL_URL.replace(/\/$/, "")}/wp-admin/admin.php?page=slicewp-payouts`;
}

export function sliceWpCommissionsAdminUrl(): string {
  return `${SHOP_REFILL_URL.replace(/\/$/, "")}/wp-admin/admin.php?page=slicewp-commissions`;
}

async function getUserIdToEmailMap(supabase: SupabaseClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const auth = supabase.auth;
  if (!auth?.admin?.listUsers) return map;

  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await auth.admin.listUsers({ page, perPage });
    if (error) break;
    const users = (data as { users?: { id: string; email?: string }[] })?.users ?? [];
    for (const u of users) {
      if (typeof u.email === "string" && u.email) {
        map.set(u.id, u.email);
      }
    }
    if (users.length < perPage) break;
    page += 1;
  }
  return map;
}

/**
 * Loads payout-focused rows for affiliates with a SliceWP id. Uses live SliceWP API (same path as dashboards).
 */
export async function loadAffiliatePayoutAdminRows(
  serviceSb: SupabaseClient
): Promise<{ rows: AffiliatePayoutAdminRow[]; sliceConfigured: boolean }> {
  if (!isSliceWPSyncEnabled()) {
    return { rows: [], sliceConfigured: false };
  }

  const profiles = await getAllAffiliateProfiles(serviceSb);
  const withSlice = profiles.filter((p) => p.slicewp_affiliate_id?.trim());
  const userIds = [...new Set(withSlice.map((p) => p.user_id))];
  const appProfiles = await getProfilesByUserIds(serviceSb, userIds);
  const displayMap: Record<string, string> = {};
  for (const ap of appProfiles) {
    const label = ap.display_name?.trim() || ap.full_name?.trim() || ap.user_id.slice(0, 8);
    displayMap[ap.user_id] = label;
  }

  const emailMap = await getUserIdToEmailMap(serviceSb);

  const rows: AffiliatePayoutAdminRow[] = [];

  for (const p of withSlice) {
    const sliceId = p.slicewp_affiliate_id!.trim();
    const commissionRows = await fetchAllCommissionRowsForAffiliate(sliceId, 25);
    const metrics = computeSliceWPCommissionMetrics(commissionRows);

    rows.push({
      userId: p.user_id,
      profileId: p.id,
      displayLabel: displayMap[p.user_id] ?? p.user_id.slice(0, 8),
      email: emailMap.get(p.user_id) ?? null,
      promoCode: p.coupon_code?.trim() ?? null,
      sliceId,
      pendingPayoutCents: metrics.availablePayoutCents,
      pendingPayoutRowCount: metrics.pendingPayoutRowCount,
      totalEarnedCents: metrics.totalEarnedCents,
      referralCountAllTime: metrics.referralUsesAllTime,
      payoutStatus: p.payout_status?.trim() ?? null,
    });
  }

  rows.sort((a, b) => b.pendingPayoutCents - a.pendingPayoutCents);

  return { rows, sliceConfigured: true };
}
