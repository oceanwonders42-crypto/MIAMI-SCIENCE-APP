import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types";

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

/**
 * Profile is complete when we have at least full_name and display_name.
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  const full = (profile.full_name ?? "").trim();
  const display = (profile.display_name ?? "").trim();
  return full.length > 0 && display.length > 0;
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "full_name"
    | "display_name"
    | "fitness_goal"
    | "preferred_units"
    | "timezone"
    | "exercise_image_variant"
    | "height_cm"
    | "goal_weight_kg"
    | "goal_body_fat_percent"
    | "onboarding_tutorial_completed"
    | "gender"
  >
>;

export type UpdateProfileResult = { error: Error | null; rowsUpdated: number };

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  update: ProfileUpdate
): Promise<UpdateProfileResult> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("id");
  if (error) return { error: new Error(error.message), rowsUpdated: 0 };
  return { error: null, rowsUpdated: (data ?? []).length };
}

/**
 * Insert a profile row with only user_id (e.g. when trigger missed or user pre-dates trigger).
 * RLS "Users can insert own profile" allows this when auth.uid() = user_id.
 */
export async function ensureProfileRow(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("profiles").insert({ user_id: userId });
  return { error: error ? new Error(error.message) : null };
}

export async function getProfilesByUserIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Profile[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", userIds);
  if (error) return [];
  return (data ?? []) as Profile[];
}
