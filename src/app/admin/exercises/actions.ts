"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { isValidImageUrl } from "@/lib/exercises";

export type ExerciseUpdatePayload = {
  image_url?: string | null;
  category?: string | null;
  muscle_group?: string | null;
  description?: string | null;
  display_order?: number | string | null;
};

export type UpdateExerciseResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateExerciseAction(
  exerciseId: string,
  payload: ExerciseUpdatePayload
): Promise<UpdateExerciseResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    return { ok: false, error: "Admin only" };
  }

  const trimmedId = exerciseId?.trim();
  if (!trimmedId) return { ok: false, error: "Exercise ID required" };

  const updates: Record<string, unknown> = {};
  if (payload.image_url !== undefined) {
    const v = payload.image_url === null || payload.image_url === "" ? null : String(payload.image_url).trim();
    if (v !== null && !isValidImageUrl(v)) {
      return { ok: false, error: "Image URL must be http or https" };
    }
    updates.image_url = v;
  }
  if (payload.category !== undefined) {
    updates.category = payload.category === null || payload.category === "" ? null : String(payload.category).trim();
  }
  if (payload.muscle_group !== undefined) {
    updates.muscle_group = payload.muscle_group === null || payload.muscle_group === "" ? null : String(payload.muscle_group).trim();
  }
  if (payload.description !== undefined) {
    updates.description = payload.description === null || payload.description === "" ? null : String(payload.description).trim();
  }
  if (payload.display_order !== undefined) {
    const v = payload.display_order;
    updates.display_order =
      v === null || v === "" || (typeof v === "number" && Number.isNaN(v)) ? null : Number(v);
  }

  if (Object.keys(updates).length === 0) {
    return { ok: true };
  }

  const service = createServiceRoleClient();
  const { error } = await service
    .from("exercises")
    .update(updates as never)
    .eq("id", trimmedId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
