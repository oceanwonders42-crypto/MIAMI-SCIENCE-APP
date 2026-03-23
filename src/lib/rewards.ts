import type { SupabaseClient } from "@supabase/supabase-js";
import type { RewardPointsLedgerEntry } from "@/types";

export async function getRewardLedger(
  supabase: SupabaseClient,
  userId: string,
  limit = 60
): Promise<RewardPointsLedgerEntry[]> {
  const { data, error } = await supabase
    .from("reward_points_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as RewardPointsLedgerEntry[];
}

/**
 * Current balance = sum of amount_delta.
 */
export async function getRewardBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("reward_points_ledger")
    .select("amount_delta")
    .eq("user_id", userId);
  if (error) return 0;
  const rows = data ?? [];
  return rows.reduce((sum, r) => sum + (r.amount_delta ?? 0), 0);
}

/**
 * Lifetime earned = sum of positive amount_delta.
 */
export async function getLifetimeEarned(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("reward_points_ledger")
    .select("amount_delta")
    .eq("user_id", userId);
  if (error) return 0;
  const rows = data ?? [];
  return rows.reduce(
    (sum, r) => sum + (r.amount_delta > 0 ? r.amount_delta : 0),
    0
  );
}

export function getLedgerEntryLabel(entry: RewardPointsLedgerEntry): string {
  return entry.description?.trim() || entry.reason || "Points";
}

export function getLedgerEntryType(
  entry: RewardPointsLedgerEntry
): "earned" | "adjusted" | "redeemed" {
  if (entry.amount_delta > 0) return "earned";
  if (entry.reason?.toLowerCase().includes("redeem")) return "redeemed";
  return "adjusted";
}

export type LedgerInsert = {
  user_id: string;
  amount_delta: number;
  reason: string;
  description?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
};

/**
 * Sum of amount_delta for entries within a date range (inclusive of start/end day in UTC).
 */
export async function getPointsChangeInRange(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const start = new Date(startDate + "T00:00:00Z").toISOString();
  const end = new Date(endDate + "T23:59:59.999Z").toISOString();
  const { data, error } = await supabase
    .from("reward_points_ledger")
    .select("amount_delta")
    .eq("user_id", userId)
    .gte("created_at", start)
    .lte("created_at", end);
  if (error) return 0;
  return (data ?? []).reduce((sum, r) => sum + (r.amount_delta ?? 0), 0);
}

export async function createLedgerEntry(
  supabase: SupabaseClient,
  insert: LedgerInsert
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("reward_points_ledger").insert({
    user_id: insert.user_id,
    amount_delta: insert.amount_delta,
    reason: insert.reason,
    description: insert.description ?? null,
    reference_type: insert.reference_type ?? null,
    reference_id: insert.reference_id ?? null,
  });
  return { error: error ? new Error(error.message) : null };
}

/** Parameters for atomic redemption via RPC. */
export type RedeemPointsRpcParams = {
  userId: string;
  optionId: string;
  points: number;
  reason: string;
  description?: string | null;
};

/**
 * Atomic reward redemption via DB function. Balance check + insert run in one
 * transaction with row lock; prevents double-spend on concurrent requests.
 * Use this for user-initiated redemption; keep createLedgerEntry for server-only credits.
 */
export async function redeemPointsRpc(
  supabase: SupabaseClient,
  params: RedeemPointsRpcParams
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("redeem_reward_points", {
    p_user_id: params.userId,
    p_option_id: params.optionId,
    p_points: params.points,
    p_reason: params.reason,
    p_description: params.description ?? null,
  });
  return { error: error ? new Error(error.message) : null };
}
