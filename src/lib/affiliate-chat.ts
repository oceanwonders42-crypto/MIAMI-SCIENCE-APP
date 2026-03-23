import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage } from "@/types";

export const AFFILIATE_ROOM_SLUG = "affiliates" as const;

/** Display label for admin-authored messages (team on the left). */
export const MIAMI_SCIENCE_TEAM_LABEL = "Miami Science Team";

export async function getAffiliateRoomId(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("slug", AFFILIATE_ROOM_SLUG)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

/** Messages for affiliate room, oldest first. */
export async function getAffiliateChatMessages(
  supabase: SupabaseClient,
  roomId: string,
  limit = 100
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ChatMessage[];
}

export function getLatestPinnedMessage(
  messages: ChatMessage[]
): ChatMessage | null {
  const pinned = messages.filter((m) => m.is_pinned);
  if (pinned.length === 0) return null;
  return pinned.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

/**
 * Count of messages from others after last_read_at (affiliate team chat unread).
 */
export async function getAffiliateChatUnreadCount(
  supabase: SupabaseClient,
  userId: string,
  roomId: string
): Promise<number> {
  const { data: receipt } = await supabase
    .from("chat_read_receipts")
    .select("last_read_at")
    .eq("user_id", userId)
    .eq("room_id", roomId)
    .maybeSingle();

  const lastRead = receipt?.last_read_at ?? "1970-01-01T00:00:00.000Z";

  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId)
    .neq("user_id", userId)
    .gt("created_at", lastRead);

  if (error) return 0;
  return Math.min(count ?? 0, 99);
}

export async function upsertAffiliateChatReadReceipt(
  supabase: SupabaseClient,
  userId: string,
  roomId: string,
  at: string = new Date().toISOString()
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("chat_read_receipts").upsert(
    {
      user_id: userId,
      room_id: roomId,
      last_read_at: at,
      updated_at: at,
    },
    { onConflict: "user_id,room_id" }
  );
  return { error: error ? new Error(error.message) : null };
}
