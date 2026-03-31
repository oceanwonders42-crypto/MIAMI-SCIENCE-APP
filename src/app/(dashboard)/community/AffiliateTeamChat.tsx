"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/types";
import {
  getLatestPinnedMessage,
  MIAMI_SCIENCE_TEAM_LABEL,
} from "@/lib/affiliate-chat";
import {
  chatPresenceHeartbeatAction,
  moderateChatMessageAction,
  markAffiliateChatReadAction,
  pinAffiliateChatMessageAction,
  postMessageAction,
  toggleChatReactionAction,
} from "./actions";
import { ReportButton } from "./ReportButton";
import { cn } from "@/lib/utils";
import {
  QUICK_REACTION_EMOJIS,
  type ReactionSummary,
} from "@/lib/chat-reactions";
import { Pin } from "lucide-react";
import { formatTimestampUtcEnUS } from "@/lib/date-display";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function attachAffiliateChatChannelHandlers(
  channel: RealtimeChannel,
  roomId: string,
  currentUserId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setReactions: React.Dispatch<
    React.SetStateAction<Record<string, ReactionSummary[]>>
  >,
  setOnlineIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  setTypingUsers: React.Dispatch<
    React.SetStateAction<{ id: string; label: string }[]>
  >,
  typingClearRef: React.MutableRefObject<
    Map<string, ReturnType<typeof setTimeout>>
  >,
  messageIdsRef: React.MutableRefObject<Set<string>>
) {
  return channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const row = normalizeMessage(payload.new as Record<string, unknown>);
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev;
          return [...prev, row].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chat_messages",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const row = normalizeMessage(payload.new as Record<string, unknown>);
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === row.id ? { ...m, ...row } : m
          );
          if (row.is_pinned) {
            return next.map((m) =>
              m.id === row.id ? m : { ...m, is_pinned: false }
            );
          }
          return next;
        });
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_reactions" },
      (payload) => {
        const n = payload.new as {
          message_id: string;
          emoji: string;
          user_id: string;
        };
        if (!messageIdsRef.current.has(n.message_id)) return;
        setReactions((prev) => {
          const list = [...(prev[n.message_id] ?? [])];
          const idx = list.findIndex((r) => r.emoji === n.emoji);
          const self = n.user_id === currentUserId;
          if (idx >= 0) {
            const next = {
              ...list[idx],
              count: list[idx].count + 1,
              self: list[idx].self || self,
            };
            list[idx] = next;
          } else {
            list.push({ emoji: n.emoji, count: 1, self });
          }
          return { ...prev, [n.message_id]: list };
        });
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "chat_reactions" },
      (payload) => {
        const oldRow = payload.old as {
          message_id?: string;
          emoji?: string;
          user_id?: string;
        } | null;
        if (!oldRow?.message_id || !oldRow.emoji) return;
        if (!messageIdsRef.current.has(oldRow.message_id)) return;
        setReactions((prev) => {
          const list = [...(prev[oldRow.message_id!] ?? [])];
          const idx = list.findIndex((r) => r.emoji === oldRow.emoji);
          if (idx < 0) return prev;
          const wasSelf = oldRow.user_id === currentUserId;
          const nextCount = list[idx].count - 1;
          let nextList: ReactionSummary[];
          if (nextCount <= 0) {
            nextList = list.filter((_, i) => i !== idx);
          } else {
            nextList = list.map((r, i) =>
              i === idx
                ? {
                    ...r,
                    count: nextCount,
                    self: wasSelf ? false : r.self,
                  }
                : r
            );
          }
          return { ...prev, [oldRow.message_id!]: nextList };
        });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_room_presence",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const row = payload.new as {
          user_id?: string;
          last_seen_at?: string;
        } | null;
        if (!row?.user_id || !row.last_seen_at) return;
        const t = new Date(row.last_seen_at).getTime();
        if (Date.now() - t > 5 * 60 * 1000) return;
        setOnlineIds((prev) => new Set(prev).add(row.user_id!));
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chat_room_presence",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const row = payload.new as {
          user_id?: string;
          last_seen_at?: string;
        } | null;
        if (!row?.user_id || !row.last_seen_at) return;
        const t = new Date(row.last_seen_at).getTime();
        if (Date.now() - t > 5 * 60 * 1000) {
          setOnlineIds((prev) => {
            const n = new Set(prev);
            n.delete(row.user_id!);
            return n;
          });
          return;
        }
        setOnlineIds((prev) => new Set(prev).add(row.user_id!));
      }
    )
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      const p = payload as { userId?: string; label?: string };
      if (!p.userId || p.userId === currentUserId) return;
      const label = p.label ?? "Someone";
      setTypingUsers((prev) => {
        const rest = prev.filter((x) => x.id !== p.userId);
        return [...rest, { id: p.userId!, label }];
      });
      const existing = typingClearRef.current.get(p.userId!);
      if (existing) clearTimeout(existing);
      const to = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((x) => x.id !== p.userId));
        typingClearRef.current.delete(p.userId!);
      }, 4000);
      typingClearRef.current.set(p.userId!, to);
    });
}

function normalizeMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    room_id: row.room_id as string,
    user_id: row.user_id as string,
    content: row.content as string,
    created_at: row.created_at as string,
    edited_at: (row.edited_at as string | null) ?? null,
    is_pinned: Boolean(row.is_pinned),
    is_admin_message: Boolean(row.is_admin_message),
    is_hidden: Boolean(row.is_hidden),
    hidden_at: (row.hidden_at as string | null) ?? null,
    hidden_by: (row.hidden_by as string | null) ?? null,
    hidden_reason: (row.hidden_reason as string | null) ?? null,
    deleted_at: (row.deleted_at as string | null) ?? null,
    deleted_by: (row.deleted_by as string | null) ?? null,
    moderation_note: (row.moderation_note as string | null) ?? null,
  };
}

interface AffiliateTeamChatProps {
  roomId: string;
  roomName: string;
  memberCount: number;
  currentUserId: string;
  isAdmin: boolean;
  initialMessages: ChatMessage[];
  displayNames: Record<string, string>;
  initialReactions: Record<string, ReactionSummary[]>;
  initialOnlineUserIds: string[];
}

export function AffiliateTeamChat({
  roomId,
  roomName,
  memberCount,
  currentUserId,
  isAdmin,
  initialMessages,
  displayNames,
  initialReactions,
  initialOnlineUserIds,
}: AffiliateTeamChatProps) {
  const supabase = useMemo(() => createClient(), []);
  const serverSig = useMemo(
    () =>
      initialMessages
        .map((m) => `${m.id}:${m.is_pinned ? 1 : 0}:${m.content.slice(0, 20)}`)
        .join("|"),
    [initialMessages]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map((m) => ({
      ...m,
      is_pinned: m.is_pinned ?? false,
      is_admin_message: m.is_admin_message ?? false,
      is_hidden: m.is_hidden ?? false,
      hidden_at: m.hidden_at ?? null,
      hidden_by: m.hidden_by ?? null,
      hidden_reason: m.hidden_reason ?? null,
      deleted_at: m.deleted_at ?? null,
      deleted_by: m.deleted_by ?? null,
      moderation_note: m.moderation_note ?? null,
    }))
  );

  useEffect(() => {
    setMessages(
      initialMessages.map((m) => ({
        ...m,
        is_pinned: m.is_pinned ?? false,
        is_admin_message: m.is_admin_message ?? false,
        is_hidden: m.is_hidden ?? false,
        hidden_at: m.hidden_at ?? null,
        hidden_by: m.hidden_by ?? null,
        hidden_reason: m.hidden_reason ?? null,
        deleted_at: m.deleted_at ?? null,
        deleted_by: m.deleted_by ?? null,
        moderation_note: m.moderation_note ?? null,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSig]);

  const [reactions, setReactions] =
    useState<Record<string, ReactionSummary[]>>(initialReactions);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(
    () => new Set(initialOnlineUserIds)
  );
  const [typingUsers, setTypingUsers] = useState<{ id: string; label: string }[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    messageIdsRef.current = new Set(messages.map((m) => m.id));
  }, [messages]);

  const pinned = useMemo(() => getLatestPinnedMessage(messages), [messages]);

  const scrollToEnd = useCallback((behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    scrollToEnd("auto");
  }, [scrollToEnd]);

  useEffect(() => {
    scrollToEnd("smooth");
  }, [messages.length, scrollToEnd]);

  useEffect(() => {
    void markAffiliateChatReadAction(roomId);
  }, [roomId]);

  useEffect(() => {
    const tick = () => void chatPresenceHeartbeatAction(roomId);
    void tick();
    const id = setInterval(tick, 25000);
    return () => clearInterval(id);
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;

    const start = async (isRetry: boolean) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) return;

      supabase.realtime.setAuth(session.access_token);

      const ch = supabase.channel(`affiliate-chat-v2:${roomId}`, {
        config: { broadcast: { ack: false } },
      });
      realtimeChannelRef.current = ch;

      attachAffiliateChatChannelHandlers(
        ch,
        roomId,
        currentUserId,
        setMessages,
        setReactions,
        setOnlineIds,
        setTypingUsers,
        typingClearRef,
        messageIdsRef
      );

      ch.subscribe((status) => {
        if (cancelled) return;
        if (status === "CHANNEL_ERROR" && !isRetry) {
          void supabase.removeChannel(ch);
          realtimeChannelRef.current = null;
          setTimeout(() => {
            if (!cancelled) void start(true);
          }, 750);
        }
      });
    };

    void start(false);

    return () => {
      cancelled = true;
      const ch = realtimeChannelRef.current;
      realtimeChannelRef.current = null;
      if (ch) void supabase.removeChannel(ch);
      typingClearRef.current.forEach((t) => clearTimeout(t));
    };
  }, [supabase, roomId, currentUserId]);

  const broadcastTyping = useCallback(() => {
    const ch = realtimeChannelRef.current;
    if (!ch) return;
    void ch.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId: currentUserId,
        label: displayNames[currentUserId] ?? "Member",
      },
    });
  }, [currentUserId, displayNames]);

  const onTypingInput = useCallback(
    (text: string) => {
      setContent(text);
      if (!text.trim()) return;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping();
      }, 200);
    },
    [broadcastTyping]
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = content.trim();
    if (!trimmed) return;
    setSending(true);
    const result = await postMessageAction(roomId, trimmed);
    setSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMessages((prev) => {
      if (prev.some((m) => m.id === result.message.id)) return prev;
      return [...prev, result.message].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
    setContent("");
    scrollToEnd("smooth");
  }

  async function handlePin(messageId: string, nextPinned: boolean) {
    setPinningId(messageId);
    setError(null);
    const result = await pinAffiliateChatMessageAction(messageId, nextPinned);
    setPinningId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
  }

  async function handleReaction(messageId: string, emoji: string) {
    const result = await toggleChatReactionAction(messageId, emoji);
    if (!result.success) {
      setError(result.error);
      return;
    }
  }

  async function handleModeration(
    messageId: string,
    action: "hide" | "unhide" | "delete"
  ) {
    let reason: string | null = null;
    if (action !== "unhide") {
      reason = window.prompt("Moderation reason (optional):", "")?.trim() || null;
    }
    const result = await moderateChatMessageAction({ messageId, action, reason });
    if (!result.success) {
      setError(result.error);
    }
  }

  const onlineInRoom = onlineIds.size;

  return (
    <div className="rounded-[1.25rem] border border-white/[0.08] bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/25 shadow-xl shadow-black/25 overflow-hidden flex flex-col min-h-[320px] max-h-[min(70vh,560px)]">
      <div className="shrink-0 px-3 py-2.5 border-b border-zinc-800/90 bg-zinc-950/50 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{roomName}</p>
          <p className="text-[11px] text-zinc-500">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
            {onlineInRoom > 0 ? ` · ${onlineInRoom} online` : ""}
          </p>
        </div>
      </div>

      {pinned && (
        <div className="shrink-0 px-3 py-2.5 border-b border-emerald-500/20 bg-emerald-950/30">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
            <Pin className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
            <span className="inline-flex items-center rounded-md bg-gradient-to-r from-emerald-600/90 to-teal-600/90 px-2 py-0.5 text-[10px] text-white shadow-sm">
              Pinned
            </span>
            Announcement
          </div>
          <p className="text-sm text-zinc-100 mt-1.5 leading-snug">{pinned.content}</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            {formatTimestampUtcEnUS(pinned.created_at)}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-pb-4">
        {typingUsers.length > 0 && (
          <p className="text-xs text-zinc-500 italic px-1">
            {typingUsers.map((t) => t.label).join(", ")}{" "}
            {typingUsers.length === 1 ? "is" : "are"} typing…
          </p>
        )}
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            No messages yet. Say hello to the team.
          </p>
        ) : (
          messages.map((m) => {
            const isTeam = m.is_admin_message;
            const isOwnAffiliate = !isTeam && m.user_id === currentUserId;
            const displayName = isTeam
              ? MIAMI_SCIENCE_TEAM_LABEL
              : isOwnAffiliate
                ? "You"
                : displayNames[m.user_id] ?? "Affiliate";
            const sideLeft = isTeam;
            const isOnline = onlineIds.has(m.user_id);

            return (
              <div
                key={m.id}
                className={cn(
                  "flex w-full gap-2",
                  sideLeft ? "justify-start" : "justify-end"
                )}
              >
                {sideLeft && (
                  <div className="relative shrink-0">
                    <div
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-emerald-900/40"
                      aria-hidden
                    >
                      MS
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "min-w-0 max-w-[85%] flex flex-col gap-1",
                    sideLeft ? "items-start" : "items-end"
                  )}
                >
                  <div
                    className={cn(
                      "w-full flex flex-col gap-0.5",
                      sideLeft ? "items-start" : "items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-2",
                        sideLeft ? "justify-start" : "justify-end"
                      )}
                    >
                      <span className="text-xs font-semibold text-zinc-100">{displayName}</span>
                      {isTeam && (
                        <span className="rounded-full bg-gradient-to-r from-teal-600/95 to-emerald-600/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm border border-teal-400/30">
                          Miami Science Team
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {formatTimestampUtcEnUS(m.created_at)}
                    </span>
                  </div>
                  <div
                    role="group"
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words shadow-md touch-manipulation",
                      sideLeft
                        ? "rounded-tl-md bg-gradient-to-br from-emerald-900/50 to-teal-900/40 text-zinc-100 border border-emerald-500/25"
                        : "rounded-tr-md bg-zinc-800/90 text-zinc-100 border border-zinc-600/40"
                    )}
                    onPointerDown={() => {
                      if (!isAdmin) return;
                      longPressTimer.current = setTimeout(() => {
                        void handlePin(m.id, !m.is_pinned);
                      }, 650);
                    }}
                    onPointerUp={() => {
                      if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                      }
                    }}
                    onPointerLeave={() => {
                      if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                      }
                    }}
                    onContextMenu={(e) => {
                      if (!isAdmin) return;
                      e.preventDefault();
                      void handlePin(m.id, !m.is_pinned);
                    }}
                  >
                    {m.deleted_at ? (
                      <span className="italic text-zinc-400">Message deleted by admin.</span>
                    ) : m.is_hidden ? (
                      <span className="italic text-zinc-400">
                        Message hidden by admin{m.hidden_reason ? `: ${m.hidden_reason}` : "."}
                      </span>
                    ) : (
                      m.content
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 justify-end max-w-full">
                    {QUICK_REACTION_EMOJIS.map((emoji) => {
                      const row = reactions[m.id]?.find((r) => r.emoji === emoji);
                      const active = row?.self;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => void handleReaction(m.id, emoji)}
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
                            active
                              ? "border-amber-500/50 bg-amber-500/15"
                              : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-600"
                          )}
                        >
                          <span>{emoji}</span>
                          {row && row.count > 0 && (
                            <span className="text-[10px] text-zinc-400 tabular-nums">{row.count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2 mt-0.5",
                      sideLeft ? "flex-row" : "flex-row-reverse"
                    )}
                  >
                    <ReportButton messageId={m.id} roomId={roomId} />
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          disabled={pinningId === m.id}
                          onClick={() => handlePin(m.id, !m.is_pinned)}
                          className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                        >
                          {m.is_pinned ? "Unpin" : "Pin"}
                        </button>
                        {!m.deleted_at && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleModeration(
                                m.id,
                                m.is_hidden ? "unhide" : "hide"
                              )
                            }
                            className="text-[11px] font-medium text-amber-400 hover:text-amber-300"
                          >
                            {m.is_hidden ? "Unhide" : "Hide"}
                          </button>
                        )}
                        {!m.deleted_at && (
                          <button
                            type="button"
                            onClick={() => void handleModeration(m.id, "delete")}
                            className="text-[11px] font-medium text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {!sideLeft && (
                  <div className="relative shrink-0">
                    <div
                      className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-200 border border-zinc-600/50"
                      aria-hidden
                    >
                      {initials(displayName)}
                    </div>
                    {isOnline && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900"
                        title="Active in the last 5 minutes"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={endRef} className="h-1 w-full shrink-0" aria-hidden />
      </div>

      {error && <p className="px-3 text-xs text-red-400 shrink-0">{error}</p>}

      <form
        onSubmit={handleSend}
        className="shrink-0 flex gap-2 p-3 border-t border-zinc-800/80 bg-zinc-950/40"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => onTypingInput(e.target.value)}
          placeholder="Message the team…"
          maxLength={2000}
          className="flex-1 rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-4 py-2.5 text-sm min-h-[44px] disabled:opacity-50 shadow-md shadow-emerald-900/25 touch-manipulation active:scale-[0.98]"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
