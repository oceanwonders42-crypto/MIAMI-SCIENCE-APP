import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModerationReport } from "@/types";
import { getRoomById } from "@/lib/community";
import { getProfilesByUserIds } from "@/lib/profile";

export interface ReportWithMessage extends ModerationReport {
  chat_messages?: { content: string; created_at: string; user_id: string } | null;
  room_slug?: string | null;
  room_name?: string | null;
  reporter_display_name?: string | null;
}

export async function getModerationReports(
  supabase: SupabaseClient,
  limit = 50
): Promise<ReportWithMessage[]> {
  const { data: reports, error } = await supabase
    .from("moderation_reports")
    .select(
      `
      *,
      chat_messages ( content, created_at, user_id )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  const list = (reports ?? []) as ReportWithMessage[];

  const roomIds = [...new Set(list.map((r) => r.room_id).filter(Boolean))] as string[];
  const reporterIds = [...new Set(list.map((r) => r.reporter_id))];
  const [rooms, profiles] = await Promise.all([
    Promise.all(roomIds.map((id) => getRoomById(supabase, id))),
    getProfilesByUserIds(supabase, reporterIds),
  ]);
  const roomMap = Object.fromEntries(
    roomIds.map((id, i) => [id, rooms[i] ?? null])
  );
  const profileMap = Object.fromEntries(
    profiles.map((p) => [
      p.user_id,
      p.display_name ?? p.full_name ?? null,
    ] as const)
  );

  return list.map((r) => ({
    ...r,
    room_slug: r.room_id ? roomMap[r.room_id]?.slug ?? null : null,
    room_name: r.room_id ? roomMap[r.room_id]?.name ?? null : null,
    reporter_display_name: profileMap[r.reporter_id] ?? null,
  }));
}

export async function updateReportStatus(
  supabase: SupabaseClient,
  reportId: string,
  status: string,
  reviewedBy: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("moderation_reports")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    })
    .eq("id", reportId);
  return { error: error ? new Error(error.message) : null };
}
