import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";
import type { ChatRoom, ChatMessage } from "@/types";

export async function getRoomsForUser(
  supabase: SupabaseClient,
  isAffiliateOrAdmin: boolean
): Promise<ChatRoom[]> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .order("is_affiliate_only", { ascending: true });
  if (error) return [];
  const rooms = (data ?? []) as ChatRoom[];
  if (isAffiliateOrAdmin) return rooms;
  return rooms.filter((r) => !r.is_affiliate_only);
}

export async function getMessages(
  supabase: SupabaseClient,
  roomId: string,
  limit = 50
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

export async function ensureRoomMembership(
  supabase: SupabaseClient,
  roomId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("chat_room_members").upsert(
    { room_id: roomId, user_id: userId, role: "member" },
    { onConflict: "room_id,user_id" }
  );
  return { error: error ? new Error(error.message) : null };
}

export async function addMessage(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
  content: string
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  const trimmed = content.trim();
  if (!trimmed) return { data: null, error: new Error("Message is required") };
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      user_id: userId,
      content: trimmed,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ChatMessage, error: null };
}

export async function getRoomMemberCount(
  supabase: SupabaseClient,
  roomId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("chat_room_members")
    .select("user_id", { count: "exact", head: true })
    .eq("room_id", roomId);
  if (error) return 0;
  return count ?? 0;
}

export async function getRoomById(
  supabase: SupabaseClient,
  roomId: string
): Promise<ChatRoom | null> {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();
  if (error) return null;
  return data as ChatRoom | null;
}

/** Get display names for user ids (user_id -> display_name or fallback). */
export async function getDisplayNamesForUserIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, full_name")
    .in("user_id", userIds);
  if (error) return {};
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const name =
      (row.display_name ?? row.full_name ?? "").trim() || "Anonymous";
    map[row.user_id as string] = name;
  }
  return map;
}
