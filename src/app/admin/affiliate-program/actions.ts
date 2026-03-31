"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

export async function updateAffiliateProgramDefaultsAction(form: {
  default_coupon_discount_percent: number;
  default_commission_percent: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { success: false, error: "Admin only" };

  const d = Number(form.default_coupon_discount_percent);
  const c = Number(form.default_commission_percent);
  if (!Number.isFinite(d) || d < 0 || d > 100) {
    return { success: false, error: "Coupon discount must be between 0 and 100." };
  }
  if (!Number.isFinite(c) || c < 0 || c > 100) {
    return { success: false, error: "Commission must be between 0 and 100." };
  }

  const { error } = await supabase
    .from("affiliate_program_settings")
    .update({
      default_coupon_discount_percent: d,
      default_commission_percent: c,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.adminAffiliateProgram);
  revalidatePath(ROUTES.admin);
  revalidatePath(ROUTES.affiliate);
  return { success: true };
}
