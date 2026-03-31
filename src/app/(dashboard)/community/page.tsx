import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getRole, isAffiliateOrAdmin, isAdmin } from "@/lib/auth";
import {
  getRoomsForUser,
  getMessages,
  getDisplayNamesForUserIds,
  ensureRoomMembership,
  getRoomMemberCount,
} from "@/lib/community";
import {
  fetchReactionSummaries,
  getOnlineUserIdsForRoom,
} from "@/lib/chat-reactions";
import { AFFILIATE_ROOM_SLUG } from "@/lib/affiliate-chat";
import { AffiliateTeamChat } from "./AffiliateTeamChat";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { PostMessageForm } from "./PostMessageForm";
import { ReportButton } from "./ReportButton";
import { CommunityRefreshButton } from "./CommunityRefreshButton";
import { MessageModerationActions } from "./MessageModerationActions";
import { BrandAtmosphereStrip } from "@/components/brand/BrandAtmosphereStrip";
import { ROUTES } from "@/lib/constants";
import { DISCLAIMER } from "@/lib/constants";
import { formatTimestampUtcEnUS } from "@/lib/date-display";

const COMMUNITY_RULES = [
  "Be respectful. No harassment or hate speech.",
  "No medical advice, dosing, or treatment recommendations.",
  "This is a support and discussion space only.",
];

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  const affiliateOrAdmin = isAffiliateOrAdmin(role);
  if (!affiliateOrAdmin) redirect(ROUTES.dashboard);
  const rooms = await getRoomsForUser(supabase, true);

  const params = await searchParams;
  /** Match bottom nav “Chat” (/community?room=affiliates): public rooms sort first in DB, so avoid defaulting there. */
  const preferredDefault =
    rooms.find((r) => r.slug === AFFILIATE_ROOM_SLUG)?.slug ?? rooms[0]?.slug ?? "community";
  /** Canonical URL so client nav active state and bookmarks match the room being shown. */
  if (!params.room?.trim() && rooms.length > 0) {
    redirect(`${ROUTES.community}?room=${encodeURIComponent(preferredDefault)}`);
  }
  const roomSlug = params.room?.trim() || preferredDefault;
  const currentRoom =
    rooms.find((r) => r.slug === roomSlug) ?? rooms[0] ?? null;

  if (!currentRoom) {
    return (
      <>
        <Header title="Community" subtitle="Questions & discussion" />
        <BrandAtmosphereStrip variant="heroSkyline" className="h-16 md:h-20" overlay="soft" />
        <div className="px-4 md:px-6 pb-8">
          <Card>
            <CardContent className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No rooms available. Contact support.
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  await ensureRoomMembership(supabase, currentRoom.id, user.id);
  const isAffiliatesRoom = currentRoom.slug === AFFILIATE_ROOM_SLUG;
  const messages = await getMessages(
    supabase,
    currentRoom.id,
    isAffiliatesRoom ? 100 : 50,
    isAdmin(role)
  );
  const userIds = [...new Set(messages.map((m) => m.user_id))];
  const displayNames = await getDisplayNamesForUserIds(supabase, userIds);

  const memberCount = await getRoomMemberCount(supabase, currentRoom.id);
  const initialReactions = await fetchReactionSummaries(
    supabase,
    messages.map((m) => m.id),
    user.id
  );
  const initialOnlineUserIds = await getOnlineUserIdsForRoom(
    supabase,
    currentRoom.id,
    5
  );

  return (
    <>
      <Header title="Community" subtitle={currentRoom.name} />
      <BrandAtmosphereStrip variant="heroSkyline" className="h-16 md:h-20" overlay="soft" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Rules & disclaimer">
          <Card className="border-zinc-200 dark:border-zinc-700">
            <CardContent className="py-4 space-y-2">
              <ul className="text-sm text-zinc-700 dark:text-zinc-300 list-disc list-inside space-y-1">
                {COMMUNITY_RULES.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                {DISCLAIMER}
              </p>
            </CardContent>
          </Card>
        </Section>
        <Section
          title="Rooms"
          action={
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Switch room
            </span>
          }
        >
          <div className="flex flex-wrap gap-2">
            {rooms.map((r) => (
              <Link
                key={r.id}
                href={`/community?room=${encodeURIComponent(r.slug)}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  r.id === currentRoom.id
                    ? "bg-primary-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {r.name}
              </Link>
            ))}
          </div>
        </Section>
        <Section
          title={currentRoom.name}
          action={
            isAffiliatesRoom ? null : <CommunityRefreshButton />
          }
        >
          {isAffiliatesRoom ? (
            <AffiliateTeamChat
              roomId={currentRoom.id}
              roomName={currentRoom.name}
              memberCount={memberCount}
              currentUserId={user.id}
              isAdmin={isAdmin(role)}
              initialMessages={messages}
              displayNames={displayNames}
              initialReactions={initialReactions}
              initialOnlineUserIds={initialOnlineUserIds}
            />
          ) : (
            <Card>
              <CardContent className="py-4 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">
                    No messages yet. Be the first to post.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-700 pb-3 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                            {displayNames[m.user_id] ?? "Anonymous"}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                            {formatTimestampUtcEnUS(m.created_at)}
                          </span>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5 break-words">
                            {m.deleted_at
                              ? "Message deleted by admin."
                              : m.is_hidden
                                ? `Message hidden by admin${m.hidden_reason ? `: ${m.hidden_reason}` : "."}`
                                : m.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ReportButton messageId={m.id} roomId={currentRoom.id} />
                          {isAdmin(role) && (
                            <MessageModerationActions
                              messageId={m.id}
                              isHidden={Boolean(m.is_hidden)}
                              isDeleted={Boolean(m.deleted_at)}
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <PostMessageForm roomId={currentRoom.id} />
              </CardContent>
            </Card>
          )}
        </Section>
      </div>
    </>
  );
}
