/**
 * SliceWP REST API integration (WordPress: /wp-json/slicewp/v1).
 * Requires: SliceWP Pro + REST API add-on, API keys (Consumer Key + Secret as Basic auth).
 *
 * Env:
 * - SLICEWP_SYNC_ENABLED=true
 * - SLICEWP_API_URL — site root (https://store.com) OR full API base (https://store.com/wp-json/slicewp/v1)
 * - SLICEWP_CONSUMER_KEY
 * - SLICEWP_CONSUMER_SECRET
 *
 * Optional (mutations only — POST/PUT/DELETE affiliates): if set, used instead of the
 * pair above so you can keep a read-only key for GETs and a Read/Write key for ULTRA:
 * - SLICEWP_WRITE_CONSUMER_KEY
 * - SLICEWP_WRITE_CONSUMER_SECRET
 *
 * Optional: affiliate_profiles.slicewp_affiliate_id (admin) to skip email lookup.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const SLICEWP_SYNC_ENABLED = process.env.SLICEWP_SYNC_ENABLED === "true";
const SLICEWP_API_URL_RAW = process.env.SLICEWP_API_URL?.trim() ?? "";
const SLICEWP_CONSUMER_KEY = process.env.SLICEWP_CONSUMER_KEY?.trim() ?? "";
const SLICEWP_CONSUMER_SECRET = process.env.SLICEWP_CONSUMER_SECRET?.trim() ?? "";
const SLICEWP_WRITE_CONSUMER_KEY = process.env.SLICEWP_WRITE_CONSUMER_KEY?.trim() ?? "";
const SLICEWP_WRITE_CONSUMER_SECRET = process.env.SLICEWP_WRITE_CONSUMER_SECRET?.trim() ?? "";

/** Stats / referred orders period written to affiliate_stats_cache */
export const SLICEWP_STATS_PERIOD = "slice_sync";

export type SliceWPCommissionDisplayStatus = "pending" | "approved" | "paid";

export interface SliceWPReferredOrderView {
  id: string;
  orderNumber: string;
  /** Order / reference amount when provided by API */
  orderTotalCents: number;
  /** Affiliate commission for this row */
  commissionCents: number;
  createdAt: string;
  statusRaw: string;
  displayStatus: SliceWPCommissionDisplayStatus;
}

export interface SliceWPCommissionMetrics {
  totalEarnedCents: number;
  monthEarnedCents: number;
  availablePayoutCents: number;
  /** Conversions / commission rows (all time) */
  referralUsesAllTime: number;
  /** Commission rows dated this calendar month (UTC) */
  referralUsesThisMonth: number;
}

export interface SliceWPAffiliatePatch {
  referralLink: string | null;
  couponCode: string | null;
  payoutStatus: string | null;
  /** Email on the SliceWP affiliate record (for WC coupon restriction checks). */
  affiliateEmail: string | null;
}

/**
 * Normalize user-provided URL to REST base ending with /v1 (no trailing slash).
 */
export function normalizeSliceWPApiBase(raw: string): string | null {
  if (!raw) return null;
  let u = raw.replace(/\/$/, "");
  if (u.includes("/wp-json/slicewp")) {
    if (!u.endsWith("/v1")) {
      u = u.replace(/\/$/, "");
      if (!u.endsWith("/v1")) u = `${u}/v1`;
    }
    return u;
  }
  return `${u}/wp-json/slicewp/v1`;
}

function getApiBase(): string | null {
  return normalizeSliceWPApiBase(SLICEWP_API_URL_RAW);
}

/**
 * SliceWP sync is on when flag is set and URL + API credentials exist.
 */
export function isSliceWPSyncEnabled(): boolean {
  return (
    SLICEWP_SYNC_ENABLED &&
    Boolean(getApiBase() && SLICEWP_CONSUMER_KEY && SLICEWP_CONSUMER_SECRET)
  );
}

type SliceWPCredentialProfile = "read" | "write";

function getSliceWPCredentials(
  profile: SliceWPCredentialProfile
): { key: string; secret: string } | null {
  if (profile === "write") {
    if (SLICEWP_WRITE_CONSUMER_KEY && SLICEWP_WRITE_CONSUMER_SECRET) {
      return { key: SLICEWP_WRITE_CONSUMER_KEY, secret: SLICEWP_WRITE_CONSUMER_SECRET };
    }
  }
  if (!SLICEWP_CONSUMER_KEY || !SLICEWP_CONSUMER_SECRET) return null;
  return { key: SLICEWP_CONSUMER_KEY, secret: SLICEWP_CONSUMER_SECRET };
}

/**
 * SliceWP REST API add-on validates consumer_key + consumer_secret from query string
 * or Basic auth (docs: consumer key as user, secret as password). Query params avoid
 * WP interpreting Basic as a core user on some hosts (401 invalid_username); for
 * mutations that return 403 with query auth, we retry once with Basic.
 */
function appendSliceWPAuthQuery(path: string, key: string, secret: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const q = new URLSearchParams({
    consumer_key: key,
    consumer_secret: secret,
  }).toString();
  return p.includes("?") ? `${p}&${q}` : `${p}?${q}`;
}

async function slicewpFetch(
  path: string,
  init?: RequestInit,
  options?: { credentialProfile?: SliceWPCredentialProfile }
): Promise<Response | null> {
  const base = getApiBase();
  if (!base) return null;
  const profile = options?.credentialProfile ?? "read";
  const creds = getSliceWPCredentials(profile);
  if (!creds) return null;
  const pathWithAuth = appendSliceWPAuthQuery(path, creds.key, creds.secret);
  const urlQuery = `${base}${pathWithAuth}`;
  const buildHeaders = (extra?: Record<string, string>): Record<string, string> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
      ...extra,
    };
    if (init?.body != null && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };
  try {
    const res = await fetch(urlQuery, {
      ...init,
      headers: buildHeaders(),
      cache: "no-store",
    });
    const method = (init?.method ?? "GET").toUpperCase();
    const isMutation = method !== "GET" && method !== "HEAD";
    if (isMutation && res.status === 403) {
      const plainPath = path.startsWith("/") ? path : `/${path}`;
      const urlBasic = `${base}${plainPath}`;
      const basic = Buffer.from(`${creds.key}:${creds.secret}`).toString("base64");
      const resBasic = await fetch(urlBasic, {
        ...init,
        headers: buildHeaders({ Authorization: `Basic ${basic}` }),
        cache: "no-store",
      });
      if (resBasic.ok) return resBasic;
    }
    return res;
  } catch {
    return null;
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function isWordPressRestErrorEnvelope(o: Record<string, unknown>): boolean {
  if (typeof o.code !== "string" || typeof o.message !== "string") return false;
  if (o.id != null) return false;
  if (pickString(o, ["email", "user_email", "affiliate_email"])) return false;
  const dr = asRecord(o.data);
  if (!dr) return true;
  const keys = Object.keys(dr);
  return keys.length === 1 && keys[0] === "status" && typeof dr.status === "number";
}

/**
 * Normalize SliceWP GET /affiliates/:id JSON — handles array bodies, { data }, and WP REST error envelopes.
 * Exported for unit tests.
 */
export function normalizeSliceWPSingleAffiliatePayload(json: unknown): Record<string, unknown> | null {
  if (json == null) return null;
  if (Array.isArray(json)) {
    const first = json[0];
    return asRecord(first);
  }
  const o = asRecord(json);
  if (!o) return null;
  if (isWordPressRestErrorEnvelope(o)) return null;
  const nested = asRecord(o.data);
  if (
    nested &&
    !isWordPressRestErrorEnvelope(nested) &&
    (nested.id != null || pickString(nested, ["email", "user_email", "affiliate_email"]))
  ) {
    return nested;
  }
  return o;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(/,/g, ""));
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function parseAffiliateList(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) {
    return json.map((x) => asRecord(x)).filter(Boolean) as Record<string, unknown>[];
  }
  const o = asRecord(json);
  if (o && Array.isArray(o.data)) {
    return o.data.map((x) => asRecord(x)).filter(Boolean) as Record<string, unknown>[];
  }
  return [];
}

function affiliateEmailFromRow(row: Record<string, unknown>): string | null {
  return (
    pickString(row, [
      "email",
      "user_email",
      "affiliate_email",
      "payment_email",
      "contact_email",
    ])?.trim() ?? null
  );
}

/**
 * All SliceWP affiliate ids whose record email matches (normalized). Used to detect ambiguity.
 */
export async function findSliceWPAffiliateIdsByEmail(
  email: string | null | undefined
): Promise<{ ids: string[]; apiError: string | null }> {
  if (!isSliceWPSyncEnabled()) return { ids: [], apiError: null };
  const needle = email?.trim().toLowerCase() ?? "";
  if (!needle) return { ids: [], apiError: null };

  const ids: string[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await slicewpFetch(
      `/affiliates?per_page=50&page=${page}&context=edit`
    );
    if (!res?.ok) {
      return {
        ids,
        apiError: res ? `SliceWP affiliates list HTTP ${res.status}` : "SliceWP request failed",
      };
    }
    const json: unknown = await res.json().catch(() => null);
    const rows = parseAffiliateList(json);
    if (rows.length === 0) break;

    for (const row of rows) {
      const em = affiliateEmailFromRow(row)?.toLowerCase() ?? null;
      if (em === needle) {
        const id = pickString(row, ["id"]) ?? String(row.id ?? "");
        if (id) ids.push(id);
      }
    }
    if (rows.length < 50) break;
  }
  return { ids, apiError: null };
}

/**
 * Resolve SliceWP affiliate id: prefer DB column, else match list by email (case-insensitive).
 * If multiple affiliates share the same email, returns null (unsafe to auto-link).
 */
export async function resolveSliceWPAffiliateId(options: {
  storedId: string | null | undefined;
  userEmail: string | null | undefined;
}): Promise<string | null> {
  if (!isSliceWPSyncEnabled()) return null;
  const sid = options.storedId?.trim();
  if (sid) return sid;

  const { ids, apiError } = await findSliceWPAffiliateIdsByEmail(options.userEmail);
  if (apiError || ids.length !== 1) return null;
  return ids[0] ?? null;
}

/**
 * GET single affiliate — map referral URL, coupon, payout-ish status.
 */
export async function fetchSliceWPAffiliatePatch(
  affiliateId: string
): Promise<SliceWPAffiliatePatch | null> {
  if (!isSliceWPSyncEnabled()) return null;
  const id = encodeURIComponent(affiliateId);

  async function loadRow(path: string): Promise<Record<string, unknown> | null> {
    const res = await slicewpFetch(path);
    if (!res?.ok) return null;
    const json: unknown = await res.json().catch(() => null);
    return normalizeSliceWPSingleAffiliatePayload(json);
  }

  const row =
    (await loadRow(`/affiliates/${id}?context=edit`)) ??
    (await loadRow(`/affiliates/${id}`));
  if (!row) return null;

  const referralLink =
    pickString(row, [
      "referral_url",
      "referral_link",
      "affiliate_url",
      "affiliate_link",
      "url",
      "site_url",
      "referral",
    ]) ?? null;
  const couponCode =
    pickString(row, [
      "coupon_code",
      "coupon",
      "affiliate_coupon",
      "wc_coupon_code",
      "woo_coupon_code",
    ]) ?? null;
  const payoutStatus =
    pickString(row, ["payout_status", "payment_status", "status"]) ?? null;
  const affiliateEmail = affiliateEmailFromRow(row);

  return { referralLink, couponCode, payoutStatus, affiliateEmail };
}

async function fetchWpTotalCount(path: string): Promise<number> {
  const res = await slicewpFetch(path);
  if (!res?.ok) return 0;
  const total = res.headers.get("x-wp-total");
  if (total != null) {
    const n = parseInt(total, 10);
    if (!Number.isNaN(n)) return n;
  }
  const json: unknown = await res.json().catch(() => null);
  if (Array.isArray(json)) return json.length;
  return 0;
}

/** Try query params SliceWP may accept for filtering collections */
function visitsQuery(affiliateId: string, page: number): string {
  const id = encodeURIComponent(affiliateId);
  return `/visits?affiliate=${id}&per_page=1&page=${page}`;
}

function visitsQueryAlt(affiliateId: string): string {
  const id = encodeURIComponent(affiliateId);
  return `/visits?affiliate_id=${id}&per_page=1&page=1`;
}

function commissionsQuery(affiliateId: string, page: number, perPage: number): string {
  const id = encodeURIComponent(affiliateId);
  return `/commissions?affiliate_id=${id}&per_page=${perPage}&page=${page}&context=edit`;
}

function commissionsQueryAlt(affiliateId: string, page: number, perPage: number): string {
  const id = encodeURIComponent(affiliateId);
  return `/commissions?affiliate=${id}&per_page=${perPage}&page=${page}&context=edit`;
}

function parseIsoDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isUtcSameMonth(d: Date, ref: Date): boolean {
  return d.getUTCFullYear() === ref.getUTCFullYear() && d.getUTCMonth() === ref.getUTCMonth();
}

export function normalizeSliceWPCommissionStatus(raw: string): SliceWPCommissionDisplayStatus {
  const s = raw.toLowerCase();
  if (/\bpaid\b/.test(s)) return "paid";
  if (/\bapproved\b/.test(s) || /\baccept/.test(s)) return "approved";
  return "pending";
}

function isRejectedCommissionRaw(raw: string): boolean {
  const s = raw.toLowerCase();
  return /\breject/.test(s) || /\brefund/.test(s) || /\bvoid/.test(s);
}

function isAvailableForPayout(
  raw: string,
  display: SliceWPCommissionDisplayStatus
): boolean {
  if (isRejectedCommissionRaw(raw)) return false;
  if (display === "paid") return false;
  return true;
}

function parseCommissionRowToView(
  r: Record<string, unknown>,
  index: number
): SliceWPReferredOrderView {
  const id = pickString(r, ["id"]) ?? String(r.id ?? "");
  const orderNumber =
    pickString(r, ["reference", "order_number", "origin", "reference_id"]) ??
    `Order ${id || index + 1}`;
  const commissionDollars = pickNumber(r, ["commission_amount", "commission"]);
  const orderDollars = pickNumber(r, ["order_amount", "order_total", "reference_amount"]);
  const amountFallback = pickNumber(r, ["amount"]);
  const commissionCents =
    commissionDollars != null
      ? Math.round(commissionDollars * 100)
      : amountFallback != null
        ? Math.round(amountFallback * 100)
        : 0;
  const orderTotalCents =
    orderDollars != null ? Math.round(orderDollars * 100) : commissionCents;
  const createdAt =
    pickString(r, ["date_created", "date", "created_at", "modified"]) ?? new Date().toISOString();
  const statusRaw =
    pickString(r, ["status", "commission_status", "payment_status"]) ?? "unknown";
  const displayStatus = normalizeSliceWPCommissionStatus(statusRaw);
  return {
    id: id || `swp-${index}`,
    orderNumber,
    orderTotalCents,
    commissionCents,
    createdAt,
    statusRaw,
    displayStatus,
  };
}

async function fetchAllCommissionRowsForAffiliate(
  affiliateId: string,
  maxPages = 25
): Promise<SliceWPReferredOrderView[]> {
  if (!isSliceWPSyncEnabled()) return [];
  const idStr = String(affiliateId);
  const out: SliceWPReferredOrderView[] = [];
  let idx = 0;
  for (let page = 1; page <= maxPages; page++) {
    let res = await slicewpFetch(commissionsQuery(affiliateId, page, 100));
    if (!res?.ok) {
      res = await slicewpFetch(commissionsQueryAlt(affiliateId, page, 100));
    }
    if (!res?.ok) break;
    const json: unknown = await res.json().catch(() => null);
    let rows = parseAffiliateList(json);
    rows = rows.filter((r) => {
      const aid = pickString(r, ["affiliate_id", "affiliate"]) ?? String(r.affiliate_id ?? "");
      return aid === idStr || aid === affiliateId;
    });
    for (const r of rows) {
      out.push(parseCommissionRowToView(r, idx));
      idx += 1;
    }
    if (rows.length < 100) break;
  }
  return out;
}

export function computeSliceWPCommissionMetrics(
  rows: SliceWPReferredOrderView[]
): SliceWPCommissionMetrics {
  const now = new Date();
  let totalEarnedCents = 0;
  let monthEarnedCents = 0;
  let availablePayoutCents = 0;
  let referralUsesThisMonth = 0;

  for (const row of rows) {
    if (isRejectedCommissionRaw(row.statusRaw)) continue;
    totalEarnedCents += row.commissionCents;
    const d = parseIsoDate(row.createdAt);
    if (d && isUtcSameMonth(d, now)) {
      monthEarnedCents += row.commissionCents;
      referralUsesThisMonth += 1;
    }
    if (isAvailableForPayout(row.statusRaw, row.displayStatus)) {
      availablePayoutCents += row.commissionCents;
    }
  }

  return {
    totalEarnedCents,
    monthEarnedCents,
    availablePayoutCents,
    referralUsesAllTime: rows.filter((r) => !isRejectedCommissionRaw(r.statusRaw)).length,
    referralUsesThisMonth,
  };
}

/**
 * Aggregate commission dollars for dashboard stats (SliceWP-connected affiliates).
 */
export async function fetchSliceWPCommissionMetrics(
  affiliateId: string
): Promise<SliceWPCommissionMetrics> {
  const rows = await fetchAllCommissionRowsForAffiliate(affiliateId);
  return computeSliceWPCommissionMetrics(rows);
}

export type SliceWPDashboardBundle = {
  metrics: SliceWPCommissionMetrics;
  recentOrders: SliceWPReferredOrderView[];
};

/**
 * Single commission scan for metrics + recent list (avoids duplicate SliceWP calls).
 */
export async function fetchSliceWPDashboardBundle(
  affiliateId: string,
  listLimit: number
): Promise<SliceWPDashboardBundle> {
  const rows = await fetchAllCommissionRowsForAffiliate(affiliateId);
  return {
    metrics: computeSliceWPCommissionMetrics(rows),
    recentOrders: rows.slice(0, listLimit),
  };
}

/**
 * Aggregate visits (clicks), commissions count (conversions), sum commission amounts (USD → cents).
 */
export async function syncSliceWPAffiliateStats(
  supabase: SupabaseClient,
  userId: string,
  affiliateId: string
): Promise<void> {
  if (!isSliceWPSyncEnabled()) return;

  let clicks = await fetchWpTotalCount(visitsQuery(affiliateId, 1));
  if (clicks === 0) {
    clicks = await fetchWpTotalCount(visitsQueryAlt(affiliateId));
  }

  let commissionRows: Record<string, unknown>[] = [];
  for (let page = 1; page <= 20; page++) {
    let res = await slicewpFetch(commissionsQuery(affiliateId, page, 100));
    if (!res?.ok) {
      res = await slicewpFetch(commissionsQueryAlt(affiliateId, page, 100));
    }
    if (!res?.ok) break;
    const json: unknown = await res.json().catch(() => null);
    const batch = parseAffiliateList(json);
    commissionRows = commissionRows.concat(batch);
    if (batch.length < 100) break;
  }

  // If API ignored filter, keep rows that mention this affiliate
  const idStr = String(affiliateId);
  const filtered = commissionRows.filter((r) => {
    const aid = pickString(r, ["affiliate_id", "affiliate"]) ?? String(r.affiliate_id ?? "");
    return aid === idStr || aid === affiliateId;
  });
  const useRows = filtered.length > 0 ? filtered : commissionRows;

  const conversions = useRows.length;
  let commissionCents = 0;
  for (const r of useRows) {
    const amt = pickNumber(r, ["amount", "commission_amount", "commission"]);
    if (amt != null) {
      // SliceWP REST typically returns amounts in currency units (dollars).
      commissionCents += Math.round(amt * 100);
    }
  }

  const { error } = await supabase.from("affiliate_stats_cache").upsert(
    {
      user_id: userId,
      period: SLICEWP_STATS_PERIOD,
      clicks,
      conversions,
      commission_cents: commissionCents,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,period" }
  );
  if (error) {
    console.error("[SliceWP] affiliate_stats_cache upsert failed:", error.message);
  }
}

/**
 * Map commissions to “referred order” rows for the affiliate dashboard.
 */
export async function fetchSliceWPReferredOrders(
  affiliateId: string,
  limit: number
): Promise<SliceWPReferredOrderView[]> {
  const all = await fetchAllCommissionRowsForAffiliate(affiliateId, 5);
  return all.slice(0, limit);
}

/**
 * @deprecated Use resolveSliceWPAffiliateId + fetchSliceWPAffiliatePatch
 */
export async function fetchSliceWPAffiliateProfile(
  externalAffiliateId: string
): Promise<null> {
  if (!isSliceWPSyncEnabled()) return null;
  await fetchSliceWPAffiliatePatch(externalAffiliateId);
  return null;
}

/**
 * Create affiliate via SliceWP REST (requires Write API key).
 * Payload shape may vary by SliceWP version; caller supplies known-safe fields.
 */
export async function createSliceWPAffiliate(
  payload: Record<string, unknown>
): Promise<{ id: string } | { error: string; status?: number }> {
  if (!isSliceWPSyncEnabled()) return { error: "SliceWP not configured" };
  const res = await slicewpFetch(
    "/affiliates",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { credentialProfile: "write" }
  );
  if (!res) return { error: "SliceWP request failed" };
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: unknown }).message)
        : `HTTP ${res.status}`;
    const code =
      typeof json === "object" && json && "code" in json
        ? String((json as { code: unknown }).code)
        : "";
    const needsWrite =
      res.status === 403 ||
      code === "rest_forbidden" ||
      /not allowed to do that/i.test(msg);
    const hint = needsWrite
      ? " ULTRA needs a SliceWP API key with Write or Read/Write permission (SliceWP → Settings → Tools → API Keys), or set SLICEWP_WRITE_CONSUMER_KEY + SLICEWP_WRITE_CONSUMER_SECRET for mutations."
      : "";
    return { error: `${msg}${hint}`, status: res.status };
  }
  const row = normalizeSliceWPSingleAffiliatePayload(json);
  if (!row) return { error: "SliceWP create returned empty payload" };
  const id = pickString(row, ["id"]) ?? (row.id != null ? String(row.id) : "");
  if (!id) return { error: "SliceWP create returned no affiliate id" };
  return { id };
}

/**
 * Update affiliate (commission, coupon linkage, etc.). Tries POST then PUT.
 */
export async function updateSliceWPAffiliate(
  affiliateId: string,
  payload: Record<string, unknown>
): Promise<{ ok: true } | { error: string; status?: number }> {
  if (!isSliceWPSyncEnabled()) return { error: "SliceWP not configured" };
  const id = encodeURIComponent(affiliateId);
  const tryPost = await slicewpFetch(
    `/affiliates/${id}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { credentialProfile: "write" }
  );
  if (tryPost?.ok) return { ok: true };
  const tryPut = await slicewpFetch(
    `/affiliates/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    { credentialProfile: "write" }
  );
  if (tryPut?.ok) return { ok: true };
  const res = tryPut ?? tryPost;
  const json: unknown = await res?.json().catch(() => null);
  const msg =
    typeof json === "object" && json && "message" in json
      ? String((json as { message: unknown }).message)
      : `HTTP ${res?.status ?? "?"}`;
  return { error: msg, status: res?.status };
}

export async function deleteSliceWPAffiliate(
  affiliateId: string
): Promise<{ ok: true } | { error: string }> {
  if (!isSliceWPSyncEnabled()) return { error: "SliceWP not configured" };
  const id = encodeURIComponent(affiliateId);
  const res = await slicewpFetch(
    `/affiliates/${id}`,
    { method: "DELETE" },
    { credentialProfile: "write" }
  );
  if (!res) return { error: "SliceWP request failed" };
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: text || `HTTP ${res.status}` };
  }
  return { ok: true };
}

/** Admin diagnostics: verify SliceWP REST responds (no payload secrets logged). */
export async function checkSliceWPConnectivity(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isSliceWPSyncEnabled()) {
    return { ok: false, error: "SliceWP not configured (env)" };
  }
  const res = await slicewpFetch("/affiliates?per_page=1&page=1&context=edit");
  if (!res) return { ok: false, error: "Network error" };
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
  return { ok: true };
}
