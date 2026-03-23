"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import {
  getCustomerMappingByUserId,
  getCustomerMappingByWooCustomerId,
  getCustomerMappingByEmail,
  upsertCustomerMapping,
  normalizeEmail,
} from "@/lib/customer-mapping";
import type { CustomerMapping, CustomerMappingMatchSource } from "@/types";

export type MappingLookupResult =
  | { ok: true; mapping: CustomerMapping | null }
  | { ok: false; error: string };

export async function getMappingByUserIdAction(
  userId: string
): Promise<MappingLookupResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { ok: false, error: "Admin only" };

  const mapping = await getCustomerMappingByUserId(supabase, userId.trim());
  return { ok: true, mapping };
}

export async function getMappingByWooIdAction(
  wooCustomerIdStr: string
): Promise<MappingLookupResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { ok: false, error: "Admin only" };

  const n = parseInt(wooCustomerIdStr.trim(), 10);
  if (Number.isNaN(n)) return { ok: false, error: "Invalid WooCommerce customer ID" };
  const mapping = await getCustomerMappingByWooCustomerId(supabase, n);
  return { ok: true, mapping };
}

export async function getMappingByEmailAction(email: string): Promise<MappingLookupResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { ok: false, error: "Admin only" };

  const mapping = await getCustomerMappingByEmail(supabase, email);
  return { ok: true, mapping };
}

export type UpsertMappingResult = { ok: true } | { ok: false; error: string };

export async function upsertMappingAction(
  user_id: string,
  woo_customer_id: number,
  customer_email: string,
  match_source: CustomerMappingMatchSource
): Promise<UpsertMappingResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { ok: false, error: "Admin only" };

  const uid = user_id.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uid)) return { ok: false, error: "Invalid user_id (must be UUID)" };
  if (!Number.isInteger(woo_customer_id) || woo_customer_id < 1) {
    return { ok: false, error: "woo_customer_id must be a positive integer" };
  }
  const email = normalizeEmail(customer_email);
  if (!email) return { ok: false, error: "customer_email required" };

  const service = createServiceRoleClient();
  return upsertCustomerMapping(service, {
    user_id: uid,
    woo_customer_id,
    customer_email: email,
    match_source,
  });
}

/** Order diagnostics: linked vs unmatched counts. Admin only. */
export type OrderDiagnosticsResult = {
  ok: true;
  total: number;
  linked: number;
  unmatched: number;
  byStatus: Record<string, { linked: number; unmatched: number }>;
};

export async function getOrderDiagnosticsAction(): Promise<
  | OrderDiagnosticsResult
  | { ok: false; error: string }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { ok: false, error: "Admin only" };

  const service = createServiceRoleClient();
  const { data: orders, error } = await service
    .from("orders")
    .select("id, user_id, status");
  if (error) return { ok: false, error: error.message };

  const rows = (orders ?? []) as { id: string; user_id: string | null; status: string }[];
  const total = rows.length;
  let linked = 0;
  let unmatched = 0;
  const byStatus: Record<string, { linked: number; unmatched: number }> = {};

  for (const r of rows) {
    const status = r.status || "unknown";
    if (!byStatus[status]) byStatus[status] = { linked: 0, unmatched: 0 };
    if (r.user_id != null) {
      linked += 1;
      byStatus[status].linked += 1;
    } else {
      unmatched += 1;
      byStatus[status].unmatched += 1;
    }
  }

  return { ok: true, total, linked, unmatched, byStatus };
}

/** Unmatched orders (user_id null) for admin review. Paginated. */
export type UnmatchedOrderRow = {
  id: string;
  external_id: string | null;
  order_number: string | null;
  customer_email: string | null;
  woo_customer_id: number | null;
  status: string;
  created_at: string;
};

export async function getUnmatchedOrdersAction(
  limit: number = 50,
  offset: number = 0
): Promise<
  | { ok: true; orders: UnmatchedOrderRow[]; total: number }
  | { ok: false; error: string }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { ok: false, error: "Admin only" };

  const service = createServiceRoleClient();
  const { count, error: countErr } = await service
    .from("orders")
    .select("id", { count: "exact", head: true })
    .is("user_id", null);
  if (countErr) return { ok: false, error: countErr.message };

  const { data: list, error } = await service
    .from("orders")
    .select("id, external_id, order_number, customer_email, woo_customer_id, status, created_at")
    .is("user_id", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return { ok: false, error: error.message };

  const orders = (list ?? []) as UnmatchedOrderRow[];
  return { ok: true, orders, total: count ?? 0 };
}

/** Candidates: app user ids with this email (from Auth). For admin review only; no auto-link. */
export type EmailCandidate = { user_id: string };

export async function getCandidatesForEmailAction(
  email: string
): Promise<
  | { ok: true; candidates: EmailCandidate[] }
  | { ok: false; error: string }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { ok: false, error: "Admin only" };

  const key = normalizeEmail(email);
  if (!key) return { ok: true, candidates: [] };

  const service = createServiceRoleClient();
  const auth = service.auth;
  if (!auth?.admin?.listUsers) return { ok: true, candidates: [] };

  const candidates: EmailCandidate[] = [];
  let page = 1;
  const perPage = 500;
  const maxPages = 10;

  for (let i = 0; i < maxPages; i++) {
    const { data, error } = await auth.admin.listUsers({ page, perPage });
    if (error) return { ok: false, error: error.message };
    const users = (data as { users?: { id: string; email?: string }[] })?.users ?? [];
    for (const u of users) {
      if (normalizeEmail(u.email) === key) candidates.push({ user_id: u.id });
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return { ok: true, candidates };
}
