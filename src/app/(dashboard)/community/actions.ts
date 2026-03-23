"use server";

import { createServerClient } from "@/lib/supabase/server";
import { addMessage, ensureRoomMembership } from "@/lib/community";
import {
  AFFILIATE_ROOM_SLUG,
  upsertAffiliateChatReadReceipt,
} from "@/lib/affiliate-chat";
import { notifyAffiliateChatRecipients } from "@/lib/notifications/affiliate-chat-push";
import { revalidatePath } from "next/cache";
import type { ChatMessage } from "@/types";
import { QUICK_REACTION_EMOJIS } from "@/lib/chat-reactions";

export async function postMessageAction(
  roomId: string,
  content: string
): Promise<
  | { success: true; message: ChatMessage }
  | { success: false; error: string }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error: joinError } = await ensureRoomMembership(
    supabase,
    roomId,
    user.id
  );
  if (joinError) return { success: false, error: joinError.message };

  const { data: roomMeta } = await supabase
    .from("chat_rooms")
    .select("slug")
    .eq("id", roomId)
    .maybeSingle();

  const { data: inserted, error } = await addMessage(supabase, roomId, user.id, content);
  if (error) return { success: false, error: error.message };
  if (!inserted) return { success: false, error: "Failed to save message" };

  if (roomMeta?.slug === AFFILIATE_ROOM_SLUG) {
    void notifyAffiliateChatRecipients({
      senderId: user.id,
      preview: content,
    });
  } else {
    revalidatePath("/community");
  }
  return { success: true, message: inserted };
}

export async function toggleChatReactionAction(
  messageId: string,
  emoji: string
): Promise<{ success: true; active: boolean } | { success: false; error: string }> {
  const trimmed = emoji.trim();
  const allowed = QUICK_REACTION_EMOJIS as readonly string[];
  if (!trimmed || !allowed.includes(trimmed)) {
    return { success: false, error: "Invalid reaction" };
  }
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: existing, error: selErr } = await supabase
    .from("chat_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", trimmed)
    .maybeSingle();

  if (selErr) return { success: false, error: selErr.message };

  if (existing) {
    const { error: delErr } = await supabase.from("chat_reactions").delete().eq("id", existing.id);
    if (delErr) return { success: false, error: delErr.message };
    return { success: true, active: false };
  }

  const { error: insErr } = await supabase.from("chat_reactions").insert({
    message_id: messageId,
    user_id: user.id,
    emoji: trimmed,
  });
  if (insErr) return { success: false, error: insErr.message };
  return { success: true, active: true };
}

export async function chatPresenceHeartbeatAction(
  roomId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const now = new Date().toISOString();
  const { error } = await supabase.from("chat_room_presence").upsert(
    {
      room_id: roomId,
      user_id: user.id,
      last_seen_at: now,
    },
    { onConflict: "room_id,user_id" }
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markAffiliateChatReadAction(
  roomId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: roomMeta } = await supabase
    .from("chat_rooms")
    .select("slug")
    .eq("id", roomId)
    .maybeSingle();

  if (roomMeta?.slug !== AFFILIATE_ROOM_SLUG) {
    return { success: false, error: "Invalid room" };
  }

  const { error } = await upsertAffiliateChatReadReceipt(
    supabase,
    user.id,
    roomId
  );
  if (error) return { success: false, error: error.message };

  revalidatePath("/community");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function pinAffiliateChatMessageAction(
  messageId: string,
  pinned: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.rpc("pin_affiliate_chat_message", {
    p_message_id: messageId,
    p_pinned: pinned,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/community");
  return { success: true };
}

export async function reportMessageAction(
  messageId: string,
  reason: string,
  roomId: string | null
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: "Reason is required" };

  const { error } = await supabase.from("moderation_reports").insert({
    reporter_id: user.id,
    message_id: messageId,
    room_id: roomId || null,
    reason: trimmed,
    status: "pending",
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/community");
  revalidatePath("/admin/moderation");
  return { success: true };
}
