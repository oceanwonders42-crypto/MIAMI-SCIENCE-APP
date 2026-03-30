"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";
import { estimateMealFromImageBase64 } from "@/lib/meal-estimate-openai";
import { PROGRESS_PHOTOS_BUCKET } from "@/lib/progress-constants";

export type EstimateMealActionResult =
  | { ok: true; calories: number; protein_g: number; carbs_g: number; fat_g: number; brief: string }
  | { ok: false; error: string };

export async function estimateMealAction(
  dataUrl: string
): Promise<EstimateMealActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const r = await estimateMealFromImageBase64(dataUrl);
  if (!r.ok) return { ok: false, error: r.error };
  return {
    ok: true,
    calories: r.calories,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    brief: r.brief,
  };
}

function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  return { mime: m[1] ?? "image/jpeg", base64: m[2] ?? "" };
}

export type SaveMealLogInput = {
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  notes?: string;
  estimate_source: "manual" | "ai";
  imageDataUrl?: string | null;
};

export type SaveMealLogResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveMealLogAction(input: SaveMealLogInput): Promise<SaveMealLogResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const calories = Math.round(Number(input.calories));
  if (!Number.isFinite(calories) || calories < 0 || calories >= 20000) {
    return { ok: false, error: "Calories must be between 0 and 19999." };
  }

  let photoPath: string | null = null;
  if (input.imageDataUrl?.startsWith("data:image/")) {
    const parsed = parseDataUrl(input.imageDataUrl);
    if (!parsed || parsed.base64.length > 5_000_000) {
      return { ok: false, error: "Image too large or invalid." };
    }
    const ext =
      parsed.mime.includes("png") ? "png" : parsed.mime.includes("webp") ? "webp" : "jpg";
    const path = `${user.id}/meal-${crypto.randomUUID()}.${ext}`;
    const buf = Buffer.from(parsed.base64, "base64");
    const { error: upErr } = await supabase.storage
      .from(PROGRESS_PHOTOS_BUCKET)
      .upload(path, buf, { contentType: parsed.mime, upsert: false });
    if (upErr) return { ok: false, error: upErr.message };
    photoPath = path;
  }

  const { error } = await supabase.from("meal_logs").insert({
    user_id: user.id,
    photo_storage_path: photoPath,
    calories,
    protein_g:
      input.protein_g != null && Number.isFinite(input.protein_g)
        ? Math.round(input.protein_g)
        : null,
    carbs_g:
      input.carbs_g != null && Number.isFinite(input.carbs_g) ? Math.round(input.carbs_g) : null,
    fat_g: input.fat_g != null && Number.isFinite(input.fat_g) ? Math.round(input.fat_g) : null,
    notes: input.notes?.trim() || null,
    estimate_source: input.estimate_source,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
