import type { SupabaseClient } from "@supabase/supabase-js";

/** Quick-reaction bar (must match UI). */
export const QUICK_REACTION_EMOJIS = ["👍", "❤️", "💪", "🔥", "👊"] as const;

export type ReactionSummary = {
  emoji: string;
  count: number;
  self: boolean;
};

/**
 * Aggregated reactions per message for initial render + dedupe logic.
 */
export async function fetchReactionSummaries(
  supabase: SupabaseClient,
  messageIds: string[],
  currentUserId: string
): Promise<Record<string, ReactionSummary[]>> {
  if (messageIds.length === 0) return {};
  const { data, error } = await supabase
    .from("chat_reactions")
    .select("message_id, emoji, user_id")
    .in("message_id", messageIds);
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[chat_reactions]", error.message);
    }
    return {};
  }
  if (!data) return {};

  const buckets = new Map<string, Map<string, { count: number; self: boolean }>>();
  for (const row of data as { message_id: string; emoji: string; user_id: string }[]) {
    const mid = row.message_id;
    if (!buckets.has(mid)) buckets.set(mid, new Map());
    const em = row.emoji;
    const b = buckets.get(mid)!;
    const cur = b.get(em) ?? { count: 0, self: false };
    cur.count += 1;
    if (row.user_id === currentUserId) cur.self = true;
    b.set(em, cur);
  }

  const out: Record<string, ReactionSummary[]> = {};
  for (const [mid, emMap] of buckets) {
    out[mid] = [...emMap.entries()]
      .map(([emoji, v]) => ({ emoji, count: v.count, self: v.self }))
      .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
  }
  return out;
}

export async function getOnlineUserIdsForRoom(
  supabase: SupabaseClient,
  roomId: string,
  withinMinutes = 5
): Promise<string[]> {
  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("chat_room_presence")
    .select("user_id")
    .eq("room_id", roomId)
    .gte("last_seen_at", cutoff);
  if (error) return [];
  return (data ?? []).map((r) => r.user_id as string);
}
