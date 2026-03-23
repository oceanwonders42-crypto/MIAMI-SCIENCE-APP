"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { createLedgerEntry } from "@/lib/rewards";

export async function adminAdjustRewardPointsAction(input: {
  userId: string;
  amountDelta: number;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    return { ok: false, error: "Admin only" };
  }

  const uid = input.userId.trim();
  if (!uid) return { ok: false, error: "User ID required" };
  if (!Number.isFinite(input.amountDelta) || input.amountDelta === 0) {
    return { ok: false, error: "Enter a non-zero number (negative to deduct)" };
  }

  const service = createServiceRoleClient();
  const { error } = await createLedgerEntry(service, {
    user_id: uid,
    amount_delta: Math.round(input.amountDelta),
    reason: input.reason.trim() || "admin_adjustment",
    description: "Admin adjustment",
    reference_type: "admin",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(ROUTES.adminRewards);
  revalidatePath("/rewards");
  return { ok: true };
}
