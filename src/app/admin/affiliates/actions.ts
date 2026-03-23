"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import {
  createAffiliateProfile,
  updateAffiliateProfile,
  type AffiliateProfileInsert,
  type AffiliateProfileUpdate,
} from "@/lib/affiliates";
import { revalidatePath } from "next/cache";

export async function createAffiliateAction(
  form: AffiliateProfileInsert & { set_role_affiliate?: boolean }
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { success: false, error: "Admin only" };

  const { set_role_affiliate, ...insert } = form;
  const { data: profile, error: createError } = await createAffiliateProfile(
    supabase,
    insert
  );
  if (createError) return { success: false, error: createError.message };

  if (set_role_affiliate) {
    await supabase
      .from("user_roles")
      .update({ role: "affiliate" })
      .eq("user_id", insert.user_id);
  }
  revalidatePath("/admin/affiliates");
  revalidatePath("/admin");
  revalidatePath("/affiliate");
  return { success: true };
}

export async function updateAffiliateAction(
  profileId: string,
  form: AffiliateProfileUpdate
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { success: false, error: "Admin only" };

  const { error } = await updateAffiliateProfile(supabase, profileId, form);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/affiliates");
  revalidatePath("/admin");
  revalidatePath("/affiliate");
  return { success: true };
}

export async function setUserRoleAffiliateAction(
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { success: false, error: "Admin only" };

  const { error } = await supabase
    .from("user_roles")
    .update({ role: "affiliate" })
    .eq("user_id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/affiliates");
  revalidatePath("/admin");
  return { success: true };
}
