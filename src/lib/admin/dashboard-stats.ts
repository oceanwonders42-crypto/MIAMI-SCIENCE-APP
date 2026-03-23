/**
 * Admin dashboard aggregates — use service role client (server-only).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { compactLineItemsForMetadata } from "@/lib/order-line-items";
import { INTEGRATION_KEYS } from "@/lib/admin/integration-log";
import { SLICEWP_STATS_PERIOD } from "@/lib/integrations/slicewp";

function utcMondayStart(d = new Date()): Date {
  const c = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = c.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  c.setUTCDate(c.getUTCDate() + diff);
  c.setUTCHours(0, 0, 0, 0);
  return c;
}

function addDaysUTC(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export type HealthStatus = "green" | "amber" | "red";

export interface IntegrationHealthRow {
  key: string;
  label: string;
  lastRunAt: string | null;
  status: HealthStatus;
  detail: string;
  summary?: Record<string, unknown>;
}

export interface TopAffiliateRow {
  userId: string;
  displayName: string | null;
  referralCode: string | null;
  commissionCents: number;
}

export interface PopularProductRow {
  name: string;
  units: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsersThisWeek: number;
  activeUsersPrevWeek: number;
  totalOrders: number;
  totalRevenueCents: number;
  totalAffiliates: number;
  totalPointsIssued: number;
  signupsThisWeek: number;
  signupsLastWeek: number;
  topAffiliates: TopAffiliateRow[];
  popularProducts: PopularProductRow[];
  integrationHealth: IntegrationHealthRow[];
  productCount: number;
  exerciseCount: number;
  mappingMatched: number;
  ordersUnmatched: number;
  sliceWpLastCacheAt: string | null;
}

function healthFromAge(lastRunAt: string | null, maxAgeHoursGreen = 48, maxAgeHoursAmber = 168): HealthStatus {
  if (!lastRunAt) return "red";
  const ageMs = Date.now() - new Date(lastRunAt).getTime();
  const hours = ageMs / (1000 * 60 * 60);
  if (hours <= maxAgeHoursGreen) return "green";
  if (hours <= maxAgeHoursAmber) return "amber";
  return "red";
}

/**
 * Load all admin overview metrics for /admin (service role).
 */
export async function loadAdminDashboardStats(supabase: SupabaseClient): Promise<AdminDashboardStats> {
  const now = new Date();
  const weekStart = utcMondayStart(now);
  const prevWeekStart = addDaysUTC(weekStart, -7);
  const weekStartIso = weekStart.toISOString();
  const prevWeekStartIso = prevWeekStart.toISOString();

  const sevenDaysAgo = addDaysUTC(now, -7).toISOString();
  const fourteenDaysAgo = addDaysUTC(now, -14).toISOString();

  const [
    profilesCount,
    affiliateRoleCount,
    ordersCount,
    revenueRow,
    pointsRows,
    checkInsWeek,
    workoutsWeek,
    ordersActivityWeek,
    checkInsPrev,
    workoutsPrev,
    ordersActivityPrev,
    signupsThis,
    signupsLast,
    topAffiliateCache,
    ordersForProducts,
    integrationRows,
    productCountRow,
    exerciseCountRow,
    mappingCountRow,
    unmatchedOrdersCount,
    sliceMax,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "affiliate"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total_cents"),
    supabase.from("reward_points_ledger").select("amount_delta"),
    supabase
      .from("check_ins")
      .select("user_id")
      .gte("check_in_date", sevenDaysAgo.slice(0, 10)),
    supabase.from("workouts").select("user_id").gte("started_at", sevenDaysAgo),
    supabase.from("orders").select("user_id").not("user_id", "is", null).gte("created_at", sevenDaysAgo),
    supabase
      .from("check_ins")
      .select("user_id")
      .gte("check_in_date", fourteenDaysAgo.slice(0, 10))
      .lt("check_in_date", sevenDaysAgo.slice(0, 10)),
    supabase
      .from("workouts")
      .select("user_id")
      .gte("started_at", fourteenDaysAgo)
      .lt("started_at", sevenDaysAgo),
    supabase
      .from("orders")
      .select("user_id")
      .not("user_id", "is", null)
      .gte("created_at", fourteenDaysAgo)
      .lt("created_at", sevenDaysAgo),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStartIso),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", prevWeekStartIso)
      .lt("created_at", weekStartIso),
    supabase
      .from("affiliate_stats_cache")
      .select("user_id, commission_cents")
      .eq("period", SLICEWP_STATS_PERIOD)
      .order("commission_cents", { ascending: false })
      .limit(5),
    supabase.from("orders").select("metadata").not("metadata", "is", null).limit(2500),
    supabase.from("integration_sync_log").select("integration, last_run_at, summary"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("exercises").select("id", { count: "exact", head: true }),
    supabase.from("customer_mappings").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).is("user_id", null),
    supabase.from("affiliate_stats_cache").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const activeSet = new Set<string>();
  const prevActiveSet = new Set<string>();
  for (const r of checkInsWeek.data ?? []) {
    const u = (r as { user_id: string }).user_id;
    if (u) activeSet.add(u);
  }
  for (const r of workoutsWeek.data ?? []) {
    const u = (r as { user_id: string }).user_id;
    if (u) activeSet.add(u);
  }
  for (const r of ordersActivityWeek.data ?? []) {
    const u = (r as { user_id: string }).user_id;
    if (u) activeSet.add(u);
  }
  for (const r of checkInsPrev.data ?? []) {
    const u = (r as { user_id: string }).user_id;
    if (u) prevActiveSet.add(u);
  }
  for (const r of workoutsPrev.data ?? []) {
    const u = (r as { user_id: string }).user_id;
    if (u) prevActiveSet.add(u);
  }
  for (const r of ordersActivityPrev.data ?? []) {
    const u = (r as { user_id: string }).user_id;
    if (u) prevActiveSet.add(u);
  }

  let totalRevenueCents = 0;
  for (const row of revenueRow.data ?? []) {
    const c = (row as { total_cents: number | null }).total_cents;
    if (typeof c === "number" && !Number.isNaN(c)) totalRevenueCents += c;
  }

  let totalPointsIssued = 0;
  for (const row of pointsRows.data ?? []) {
    const d = (row as { amount_delta: number }).amount_delta;
    if (typeof d === "number" && d > 0) totalPointsIssued += d;
  }

  const productAgg = new Map<string, number>();
  for (const row of ordersForProducts.data ?? []) {
    const m = (row as { metadata: unknown }).metadata;
    if (!m || typeof m !== "object") continue;
    const li = (m as Record<string, unknown>).line_items;
    const items = compactLineItemsForMetadata(li);
    if (!items) continue;
    for (const it of items) {
      const key = it.name.trim() || "Unknown";
      productAgg.set(key, (productAgg.get(key) ?? 0) + it.quantity);
    }
  }
  const popularProducts: PopularProductRow[] = [...productAgg.entries()]
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const logMap = new Map<string, { last_run_at: string; summary: Record<string, unknown> }>();
  for (const row of integrationRows.data ?? []) {
    const r = row as { integration: string; last_run_at: string; summary: Record<string, unknown> };
    logMap.set(r.integration, { last_run_at: r.last_run_at, summary: r.summary ?? {} });
  }

  const cron = logMap.get(INTEGRATION_KEYS.NOTIFICATIONS_CRON);
  const webhook = logMap.get(INTEGRATION_KEYS.STORE_ORDER_WEBHOOK);
  const ship = logMap.get(INTEGRATION_KEYS.SHIPSTATION_SHIPMENTS);
  const productSync = logMap.get(INTEGRATION_KEYS.WOOCOMMERCE_PRODUCTS);
  const backfillLog = logMap.get(INTEGRATION_KEYS.WOOCOMMERCE_BACKFILL);

  const sliceLast = (sliceMax.data as { updated_at: string } | null)?.updated_at ?? null;

  const integrationHealth: IntegrationHealthRow[] = [
    {
      key: "cron",
      label: "Notification cron",
      lastRunAt: cron?.last_run_at ?? null,
      status: healthFromAge(cron?.last_run_at ?? null, 26, 7 * 24),
      detail: "Scheduled emails & push batch",
      summary: cron?.summary,
    },
    {
      key: "webhook",
      label: "Order webhook (WooCommerce)",
      lastRunAt: webhook?.last_run_at ?? null,
      status: healthFromAge(webhook?.last_run_at ?? null, 72, 14 * 24),
      detail: "Last successful order webhook",
      summary: webhook?.summary,
    },
    {
      key: "slicewp",
      label: "SliceWP stats cache",
      lastRunAt: sliceLast,
      status: sliceLast ? healthFromAge(sliceLast, 7 * 24, 30 * 24) : "amber",
      detail: "Affiliate commission cache (in-app sync)",
      summary: {},
    },
    {
      key: "shipstation",
      label: "ShipStation shipment sync",
      lastRunAt: ship?.last_run_at ?? null,
      status: healthFromAge(ship?.last_run_at ?? null, 72, 14 * 24),
      detail: "Admin-triggered shipment import",
      summary: ship?.summary,
    },
    {
      key: "product_sync",
      label: "WooCommerce product sync",
      lastRunAt: productSync?.last_run_at ?? null,
      status: healthFromAge(productSync?.last_run_at ?? null, 7 * 24, 30 * 24),
      detail: "Catalog import from store",
      summary: productSync?.summary,
    },
    {
      key: "woo_backfill",
      label: "WooCommerce backfill",
      lastRunAt: backfillLog?.last_run_at ?? null,
      status: healthFromAge(backfillLog?.last_run_at ?? null, 7 * 24, 30 * 24),
      detail: "Historical customers & orders",
      summary: backfillLog?.summary,
    },
  ];

  const topRows = (topAffiliateCache.data ?? []) as { user_id: string; commission_cents: number }[];
  let topAffiliates: TopAffiliateRow[] = [];
  if (topRows.length > 0) {
    const ids = topRows.map((x) => x.user_id);
    const [pr, af] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
      supabase.from("affiliate_profiles").select("user_id, referral_code").in("user_id", ids),
    ]);
    const nameBy = new Map(
      (pr.data ?? []).map((r: { user_id: string; full_name: string | null }) => [r.user_id, r.full_name])
    );
    const refBy = new Map(
      (af.data ?? []).map((r: { user_id: string; referral_code: string }) => [r.user_id, r.referral_code])
    );
    topAffiliates = topRows.map((row) => ({
      userId: row.user_id,
      displayName: (nameBy.get(row.user_id) as string | null | undefined) ?? null,
      referralCode: (refBy.get(row.user_id) as string | undefined) ?? null,
      commissionCents: row.commission_cents ?? 0,
    }));
  }

  return {
    totalUsers: profilesCount.count ?? 0,
    activeUsersThisWeek: activeSet.size,
    activeUsersPrevWeek: prevActiveSet.size,
    totalOrders: ordersCount.count ?? 0,
    totalRevenueCents,
    totalAffiliates: affiliateRoleCount.count ?? 0,
    totalPointsIssued,
    signupsThisWeek: signupsThis.count ?? 0,
    signupsLastWeek: signupsLast.count ?? 0,
    topAffiliates,
    popularProducts,
    integrationHealth,
    productCount: productCountRow.count ?? 0,
    exerciseCount: exerciseCountRow.count ?? 0,
    mappingMatched: mappingCountRow.count ?? 0,
    ordersUnmatched: unmatchedOrdersCount.count ?? 0,
    sliceWpLastCacheAt: sliceLast,
  };
}
