"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { isValidImageUrl } from "@/lib/exercises";
import { generateExerciseImageUrl } from "@/lib/image-generation";

export type GenerateExerciseImageResult =
  | { ok: true; imageUrl: string }
  | { ok: false; error: string };

/**
 * Generates one AI image for an exercise and saves `image_url` (admin only).
 */
export async function generateExerciseImageAction(exerciseId: string): Promise<GenerateExerciseImageResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    return { ok: false, error: "Admin only" };
  }

  const id = exerciseId?.trim();
  if (!id) return { ok: false, error: "Exercise ID required" };

  const { data: row, error: fetchErr } = await supabase
    .from("exercises")
    .select("id, name, slug")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !row) {
    return { ok: false, error: "Exercise not found" };
  }

  const gen = await generateExerciseImageUrl({
    exerciseName: row.name,
    slug: row.slug,
  });
  if ("error" in gen) {
    console.error("[generateExerciseImageAction] generation failed", {
      exerciseId: id,
      name: row.name,
      slug: row.slug,
      error: gen.error,
    });
    return { ok: false, error: gen.error };
  }
  const imageUrl = gen.url;
  if (!isValidImageUrl(imageUrl)) {
    const err = `Generated URL was invalid or blocked by validation: ${String(imageUrl).slice(0, 120)}`;
    console.error("[generateExerciseImageAction]", err);
    return { ok: false, error: err };
  }

  const service = createServiceRoleClient();
  const { error: upErr } = await service
    .from("exercises")
    .update({ image_url: imageUrl } as never)
    .eq("id", id);
  if (upErr) {
    console.error("[generateExerciseImageAction] Supabase update failed", {
      exerciseId: id,
      message: upErr.message,
    });
    return { ok: false, error: `Database: ${upErr.message}` };
  }
  return { ok: true, imageUrl };
}
