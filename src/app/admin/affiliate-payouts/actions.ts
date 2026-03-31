"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { backfillAffiliateStatsCacheFromSlice } from "@/lib/integrations/affiliate-stats-backfill";

export type BackfillSliceStatsResult =
  | { ok: true; profilesProcessed: number; profilesSkippedNoSliceId: number }
  | { ok: false; error: string };

export async function runAffiliateSliceStatsBackfillAdminAction(): Promise<BackfillSliceStatsResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { ok: false, error: "Forbidden" };

  try {
    const service = createServiceRoleClient();
    const r = await backfillAffiliateStatsCacheFromSlice(service);
    revalidatePath(ROUTES.adminAffiliatePayouts);
    revalidatePath(ROUTES.adminAffiliates);
    revalidatePath(ROUTES.admin);
    revalidatePath(ROUTES.affiliate);
    return {
      ok: true,
      profilesProcessed: r.profilesProcessed,
      profilesSkippedNoSliceId: r.profilesSkippedNoSliceId,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
