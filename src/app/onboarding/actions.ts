"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  updateProfile,
  ensureProfileRow,
  type ProfileUpdate,
} from "@/lib/profile";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants";
import type { ProfileGender } from "@/types";

function normalizeGender(raw: unknown): ProfileGender | null {
  if (raw === "" || raw === undefined || raw === null) return null;
  if (raw === "male" || raw === "female" || raw === "prefer_not_to_say") return raw;
  return null;
}

/** Forms send `gender` as string; normalized server-side. */
export type SaveProfileFormInput = Omit<ProfileUpdate, "gender"> & { gender?: unknown };

export async function saveOnboarding(
  formData: SaveProfileFormInput
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const fullName = (formData.full_name ?? "").trim();
  const displayName = (formData.display_name ?? "").trim();
  if (fullName.length === 0 || displayName.length === 0) {
    return {
      success: false,
      error: "Full name and display name are required.",
    };
  }

  const payload: ProfileUpdate = {
    ...formData,
    full_name: fullName,
    display_name: displayName,
    gender: normalizeGender(formData.gender),
  };

  let result = await updateProfile(supabase, user.id, payload);
  if (result.error) {
    return { success: false, error: result.error.message };
  }
  if (result.rowsUpdated === 0) {
    const ensure = await ensureProfileRow(supabase, user.id);
    if (ensure.error) {
      return {
        success: false,
        error: "Your profile could not be created. Please try again or contact support.",
      };
    }
    result = await updateProfile(supabase, user.id, payload);
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    if (result.rowsUpdated === 0) {
      return {
        success: false,
        error: "Your profile could not be updated. Please try again or contact support.",
      };
    }
  }

  revalidatePath("/onboarding");
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.progress);
  revalidatePath("/account");
  revalidatePath("/");
  return { success: true };
}
