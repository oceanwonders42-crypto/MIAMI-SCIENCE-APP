/**
 * Affiliate data provider boundary.
 * When SliceWP sync is enabled (env + credentials), profile/stats/referred orders
 * are merged from the SliceWP REST API; otherwise DB-only (referred orders from orders.referred_by_user_id).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateProfile, AffiliateStatsCache, Order } from "@/types";
import {
  getAffiliateProfile,
  getAffiliateStats,
  buildReferralLink as buildLink,
} from "@/lib/affiliates";
import { formatOrderNumber } from "@/lib/orders";
import {
  isSliceWPSyncEnabled,
  resolveSliceWPAffiliateId,
  fetchSliceWPAffiliatePatch,
  syncSliceWPAffiliateStats,
  fetchSliceWPReferredOrders,
  SLICEWP_STATS_PERIOD,
} from "@/lib/integrations/slicewp";

export interface AffiliateProfileView {
  profile: AffiliateProfile | null;
  referralLink: string;
  couponCode: string | null;
  payoutStatus: string | null;
}

export interface AffiliateStatsView {
  clicks: number;
  conversions: number;
  commissionCents: number;
  commissionFormatted: string;
  payoutStatus: string | null;
  lastSyncedAt: string | null;
}

export interface ReferredOrderView {
  id: string;
  orderNumber: string;
  orderTotalCents: number;
  commissionCents: number;
  createdAt: string;
  statusRaw: string;
  displayStatus: "pending" | "approved" | "paid";
}

/** Contract for future SliceWP (or other) integration. */
export interface IAffiliateProvider {
  getProfileView(supabase: SupabaseClient, userId: string, baseUrl: string): Promise<AffiliateProfileView>;
  getStatsView(supabase: SupabaseClient, userId: string): Promise<AffiliateStatsView>;
  getRecentReferredOrders(supabase: SupabaseClient, userId: string, limit: number): Promise<ReferredOrderView[]>;
}

async function resolveSliceId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  if (!isSliceWPSyncEnabled()) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getAffiliateProfile(supabase, userId);
  return resolveSliceWPAffiliateId({
    storedId: profile?.slicewp_affiliate_id,
    userEmail: user?.email ?? null,
  });
}

export const affiliateProvider: IAffiliateProvider = {
  async getProfileView(supabase, userId, baseUrl) {
    const profile = await getAffiliateProfile(supabase, userId);
    let referralLink = buildLink(profile, baseUrl);
    let couponCode = profile?.coupon_code ?? null;
    let payoutStatus = profile?.payout_status ?? null;

    if (isSliceWPSyncEnabled()) {
      const sliceId = await resolveSliceId(supabase, userId);
      if (sliceId) {
        const patch = await fetchSliceWPAffiliatePatch(sliceId);
        if (patch) {
          if (patch.referralLink) referralLink = patch.referralLink;
          if (patch.couponCode) couponCode = patch.couponCode;
          if (patch.payoutStatus) payoutStatus = patch.payoutStatus;
        }
      }
    }

    return {
      profile,
      referralLink,
      couponCode,
      payoutStatus,
    };
  },

  async getStatsView(supabase, userId) {
    let sliceId: string | null = null;
    if (isSliceWPSyncEnabled()) {
      sliceId = await resolveSliceId(supabase, userId);
      if (sliceId) {
        await syncSliceWPAffiliateStats(supabase, userId, sliceId);
      }
    }

    let stats: AffiliateStatsCache | null = null;
    if (isSliceWPSyncEnabled()) {
      stats = await getAffiliateStats(supabase, userId, {
        period: SLICEWP_STATS_PERIOD,
      });
    }
    if (!stats) {
      stats = await getAffiliateStats(supabase, userId);
    }

    const profile = await getAffiliateProfile(supabase, userId);
    const patch =
      sliceId != null ? await fetchSliceWPAffiliatePatch(sliceId) : null;
    const payoutStatus =
      patch?.payoutStatus ?? profile?.payout_status ?? null;

    return {
      clicks: stats?.clicks ?? 0,
      conversions: stats?.conversions ?? 0,
      commissionCents: stats?.commission_cents ?? 0,
      commissionFormatted:
        stats != null
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
              stats.commission_cents / 100
            )
          : "$0.00",
      payoutStatus,
      lastSyncedAt: stats?.updated_at ?? null,
    };
  },

  async getRecentReferredOrders(supabase, userId, limit) {
    if (isSliceWPSyncEnabled()) {
      const sliceId = await resolveSliceId(supabase, userId);
      if (sliceId) {
        const fromSlice = await fetchSliceWPReferredOrders(sliceId, limit);
        if (fromSlice.length > 0) {
          return fromSlice.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            orderTotalCents: o.orderTotalCents,
            commissionCents: o.commissionCents,
            createdAt: o.createdAt,
            statusRaw: o.statusRaw,
            displayStatus: o.displayStatus,
          }));
        }
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, external_id, total_cents, status, created_at")
      .eq("referred_by_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    const orders = data ?? [];
    return orders.map((o) => {
      const st = (o.status ?? "unknown").toLowerCase();
      const displayStatus: ReferredOrderView["displayStatus"] =
        st === "completed" ? "approved" : st === "paid" ? "paid" : "pending";
      return {
        id: o.id,
        orderNumber: formatOrderNumber(o as Order),
        orderTotalCents: o.total_cents ?? 0,
        commissionCents: 0,
        createdAt: o.created_at,
        statusRaw: o.status ?? "unknown",
        displayStatus,
      };
    });
  },
};
