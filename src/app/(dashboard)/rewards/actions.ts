"use server";

import { createServerClient } from "@/lib/supabase/server";
import { redeemPointsRpc } from "@/lib/rewards";
import { REDEMPTION_OPTIONS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants";

export async function redeemPointsAction(
  optionId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const option = REDEMPTION_OPTIONS.find((o) => o.id === optionId);
  if (!option) return { success: false, error: "Invalid redemption option." };

  const { error } = await redeemPointsRpc(supabase, {
    userId: user.id,
    optionId,
    points: option.points,
    reason: `Redeemed: ${option.label}`,
    description: option.description ?? undefined,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.rewards);
  revalidatePath(ROUTES.dashboard);
  return { success: true };
}
