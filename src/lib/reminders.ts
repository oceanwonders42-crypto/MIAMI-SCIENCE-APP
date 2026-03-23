import type { SupabaseClient } from "@supabase/supabase-js";
import { getAttentionItems } from "./attention-items";
import { ROUTES } from "./constants";

export type ReminderNudge = {
  id: string;
  type: "low_supply" | "reorder_soon" | "comeback" | "delivered_not_added" | "comeback_workout";
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
};

/**
 * Build in-app reminder nudges from unified attention items.
 * Includes: low supply / reorder soon / overdue, delivered not added to stack, comeback (check-in), no recent workout.
 */
export async function getReminderNudges(
  supabase: SupabaseClient,
  userId: string
): Promise<ReminderNudge[]> {
  const items = await getAttentionItems(supabase, userId);
  return items.map((item) => ({
    id: item.id,
    type:
      item.type === "comeback_workout"
        ? "comeback_workout"
        : item.type === "delivered_not_added"
          ? "delivered_not_added"
          : item.type === "overdue_reorder" || item.type === "reorder_soon"
            ? (item.type === "overdue_reorder" ? "low_supply" : "reorder_soon")
            : "comeback",
    title: item.title,
    message: item.message,
    ctaLabel: item.ctaLabel,
    ctaUrl: item.ctaUrl,
  }));
}
