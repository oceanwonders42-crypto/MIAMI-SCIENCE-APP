"use server";

import { createServerClient } from "@/lib/supabase/server";
import { upsertCheckIn, todayDateString } from "@/lib/check-ins";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants";

export async function completeOnboardingTutorialAction(): Promise<{ ok: boolean }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_tutorial_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { ok: false };
  revalidatePath(ROUTES.dashboard);
  return { ok: true };
}

export async function submitCheckInAction(payload: {
  routine_done: boolean;
  worked_out: boolean;
  note?: string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const date = todayDateString();
  const { error } = await upsertCheckIn(supabase, user.id, date, {
    routine_done: payload.routine_done,
    worked_out: payload.worked_out,
    note: payload.note?.trim() || null,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.dashboard);
  return { success: true };
}
