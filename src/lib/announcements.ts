import type { SupabaseClient } from "@supabase/supabase-js";
import type { Announcement } from "@/types";

/**
 * Fetch published announcements (published_at <= now), newest first.
 * Used on dashboard for read-only display.
 */
export async function getActiveAnnouncements(
  supabase: SupabaseClient,
  limit = 5
): Promise<Announcement[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Announcement[];
}
