/**
 * Server-side data for the affiliate tab: commissions, connection state, referral usage, referred orders.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAffiliateProfile } from "@/lib/affiliates";
import { formatOrderNumber } from "@/lib/orders";
import type { Order } from "@/types";
import { affiliateProvider, type ReferredOrderView } from "@/lib/integrations/affiliate-provider";
import {
  isSliceWPSyncEnabled,
  resolveSliceWPAffiliateId,
  syncSliceWPAffiliateStats,
  fetchSliceWPDashboardBundle,
  SLICEWP_STATS_PERIOD,
} from "@/lib/integrations/slicewp";
import type { AffiliateExternalSyncPresentation } from "@/lib/integrations/affiliate-external-sync";

export type AffiliateConnectionBanner =
  | { variant: "connected"; label: string; lastSyncedAt: string | null }
  | { variant: "configured_unlinked"; label: string; detail: string }
  | { variant: "not_configured"; label: string; detail: string };

export type CommissionDashboardStats = {
  totalEarnedCents: number;
  monthEarnedCents: number;
  availablePayoutCents: number;
  referralUsesThisMonth: number;
  referralUsesAllTime: number;
  dataSource: "slice" | "cache" | "orders";
};

async function sumCommissionAllCachePeriods(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("affiliate_stats_cache")
    .select("commission_cents")
    .eq("user_id", userId);
  if (error) return 0;
  return (data ?? []).reduce((s, r) => s + (r.commission_cents ?? 0), 0);
}

async function countReferredOrders(
  supabase: SupabaseClient,
  userId: string,
  options?: { sinceIso?: string }
): Promise<number> {
  let q = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_user_id", userId);
  if (options?.sinceIso) {
    q = q.gte("created_at", options.sinceIso);
  }
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

function monthStartUtcIso(): string {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1)).toISOString();
}

function mapDbOrderStatus(status: string): ReferredOrderView["displayStatus"] {
  const s = status.toLowerCase();
  if (s === "completed") return "approved";
  if (s === "processing" || s === "pending" || s === "on-hold") return "pending";
  return "pending";
}

async function resolveSliceIdForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  if (!isSliceWPSyncEnabled()) return null;
  const profile = await getAffiliateProfile(supabase, userId);
  const stored = profile?.slicewp_affiliate_id?.trim();
  if (stored) return stored;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return resolveSliceWPAffiliateId({
    storedId: null,
    userEmail: user?.email ?? null,
  });
}

export async function getAffiliateConnectionBanner(
  supabase: SupabaseClient,
  userId: string,
  lastSyncedAt: string | null,
  externalSync?: AffiliateExternalSyncPresentation | null
): Promise<AffiliateConnectionBanner> {
  if (!isSliceWPSyncEnabled()) {
    return {
      variant: "not_configured",
      label: "Not connected",
      detail: "Set up SliceWP in Admin → Integrations",
    };
  }
  const sliceId =
    externalSync?.slicewpAffiliateId?.trim() ||
    (await resolveSliceIdForUser(supabase, userId));
  if (!sliceId) {
    return {
      variant: "configured_unlinked",
      label: "SliceWP not linked to your account",
      detail:
        "Ask an admin to set your SliceWP affiliate ID on your profile, or ensure your app email matches your SliceWP affiliate email.",
    };
  }
  const relative = formatRelativeMinutes(lastSyncedAt);
  return {
    variant: "connected",
    label: relative ? `Connected — last synced ${relative}` : "Connected — syncing…",
    lastSyncedAt,
  };
}

/** Relative time for UI (e.g. SliceWP “last synced …”). */
export function formatLastSyncedRelative(iso: string | null): string {
  if (!iso) return "just now";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "just now";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const h = Math.floor(mins / 60);
  if (h === 1) return "1 hour ago";
  if (h < 48) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function formatRelativeMinutes(iso: string | null): string | null {
  if (!iso) return null;
  return formatLastSyncedRelative(iso);
}

export async function loadAffiliateTabData(
  supabase: SupabaseClient,
  userId: string,
  baseUrl: string
): Promise<{
  profileView: Awaited<ReturnType<typeof affiliateProvider.getProfileView>>;
  connection: AffiliateConnectionBanner;
  commissions: CommissionDashboardStats;
  referredOrders: ReferredOrderView[];
  lastSyncedAt: string | null;
}> {
  const profileView = await affiliateProvider.getProfileView(supabase, userId, baseUrl);
  const sliceId =
    profileView.externalSync?.slicewpAffiliateId ??
    (await resolveSliceIdForUser(supabase, userId));

  let lastSyncedAt: string | null = null;
  const { data: cacheRow } = await supabase
    .from("affiliate_stats_cache")
    .select("updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  lastSyncedAt = (cacheRow as { updated_at?: string } | null)?.updated_at ?? null;

  let commissions: CommissionDashboardStats;
  let referredOrders: ReferredOrderView[] = [];

  if (isSliceWPSyncEnabled() && sliceId) {
    await syncSliceWPAffiliateStats(supabase, userId, sliceId);
    const { data: fresh } = await supabase
      .from("affiliate_stats_cache")
      .select("updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastSyncedAt = (fresh as { updated_at?: string } | null)?.updated_at ?? lastSyncedAt;

    const bundle = await fetchSliceWPDashboardBundle(sliceId, 25);
    const m = bundle.metrics;

    const { data: sliceSyncRow } = await supabase
      .from("affiliate_stats_cache")
      .select("commission_cents, conversions")
      .eq("user_id", userId)
      .eq("period", SLICEWP_STATS_PERIOD)
      .maybeSingle();
    const cacheCents = sliceSyncRow?.commission_cents ?? 0;
    const cacheConv = sliceSyncRow?.conversions ?? 0;
    const sliceEmpty = m.totalEarnedCents === 0 && m.referralUsesAllTime === 0;
    const cacheHasTotals = cacheCents > 0 || cacheConv > 0;

    if (sliceEmpty && cacheHasTotals) {
      commissions = {
        totalEarnedCents: cacheCents,
        monthEarnedCents: 0,
        availablePayoutCents: cacheCents,
        referralUsesThisMonth: 0,
        referralUsesAllTime: cacheConv,
        dataSource: "cache",
      };
      referredOrders = [];
    } else {
      commissions = {
        totalEarnedCents: m.totalEarnedCents,
        monthEarnedCents: m.monthEarnedCents,
        availablePayoutCents: m.availablePayoutCents,
        referralUsesThisMonth: m.referralUsesThisMonth,
        referralUsesAllTime: m.referralUsesAllTime,
        dataSource: "slice",
      };
      referredOrders = bundle.recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        orderTotalCents: o.orderTotalCents,
        commissionCents: o.commissionCents,
        createdAt: o.createdAt,
        statusRaw: o.statusRaw,
        displayStatus: o.displayStatus,
      }));
    }
  } else {
    const cacheTotal = await sumCommissionAllCachePeriods(supabase, userId);
    const monthStart = monthStartUtcIso();
    const [monthCount, allCount] = await Promise.all([
      countReferredOrders(supabase, userId, { sinceIso: monthStart }),
      countReferredOrders(supabase, userId),
    ]);

    commissions = {
      totalEarnedCents: cacheTotal,
      monthEarnedCents: 0,
      availablePayoutCents: cacheTotal,
      referralUsesThisMonth: monthCount,
      referralUsesAllTime: allCount,
      dataSource: cacheTotal > 0 ? "cache" : "orders",
    };

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, order_number, external_id, total_cents, status, created_at")
      .eq("referred_by_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25);
    if (!error && orders) {
      referredOrders = orders.map((o) => ({
        id: o.id,
        orderNumber: formatOrderNumber(o as Order),
        orderTotalCents: o.total_cents ?? 0,
        commissionCents: 0,
        createdAt: o.created_at,
        statusRaw: o.status ?? "unknown",
        displayStatus: mapDbOrderStatus(o.status ?? ""),
      }));
    }
  }

  const connection = await getAffiliateConnectionBanner(
    supabase,
    userId,
    lastSyncedAt,
    profileView.externalSync
  );

  return {
    profileView,
    connection,
    commissions,
    referredOrders,
    lastSyncedAt,
  };
}

/**
 * Total referral orders for affiliate rewards UI (SliceWP all-time when linked, else DB count on `orders.referred_by_user_id`).
 */
export async function getAffiliateReferralOrderCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  if (isSliceWPSyncEnabled()) {
    const sliceId = await resolveSliceIdForUser(supabase, userId);
    if (sliceId) {
      await syncSliceWPAffiliateStats(supabase, userId, sliceId);
      const bundle = await fetchSliceWPDashboardBundle(sliceId, 25);
      const n = bundle.metrics.referralUsesAllTime;
      if (n > 0) return n;
      const { data: row } = await supabase
        .from("affiliate_stats_cache")
        .select("conversions")
        .eq("user_id", userId)
        .eq("period", SLICEWP_STATS_PERIOD)
        .maybeSingle();
      return row?.conversions ?? 0;
    }
  }
  return countReferredOrders(supabase, userId);
}
