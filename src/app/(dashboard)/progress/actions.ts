"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createBodyMetric, deleteBodyMetric } from "@/lib/body-metrics";
import { updateProfile } from "@/lib/profile";
import {
  insertProgressPhoto,
  deleteProgressPhotoRow,
  removeStorageObjects,
} from "@/lib/progress-photos";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/constants";

const MEASURE_KEYS = new Set([
  "chest_cm",
  "waist_cm",
  "hips_cm",
  "arm_cm",
  "leg_cm",
]);

function cleanMeasurements(
  raw: Record<string, number> | null | undefined
): Record<string, number> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!MEASURE_KEYS.has(k)) continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) continue;
    out[k] = n;
  }
  return Object.keys(out).length ? out : null;
}

export async function createBodyMetricAction(form: {
  recorded_at: string;
  weight_kg?: number | null;
  body_fat_percent?: number | null;
  measurements?: Record<string, number> | null;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const w = form.weight_kg != null ? Number(form.weight_kg) : null;
  if (w != null && (Number.isNaN(w) || w < 0))
    return { success: false, error: "Weight must be 0 or more." };
  const bf = form.body_fat_percent != null ? Number(form.body_fat_percent) : null;
  if (bf != null && (Number.isNaN(bf) || bf < 0 || bf > 100))
    return { success: false, error: "Body fat must be between 0 and 100%." };
  const measurements = cleanMeasurements(form.measurements ?? null);
  if (
    w == null &&
    bf == null &&
    measurements == null
  ) {
    return { success: false, error: "Enter at least weight, body fat, or one measurement." };
  }
  const { data, error } = await createBodyMetric(supabase, {
    user_id: user.id,
    recorded_at: form.recorded_at,
    weight_kg: w ?? null,
    body_fat_percent: bf ?? null,
    measurements,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.progress);
  return { success: true, id: data!.id };
}

export async function deleteBodyMetricAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { error } = await deleteBodyMetric(supabase, id, user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.progress);
  return { success: true };
}

export async function registerProgressPhotoAction(input: {
  storagePath: string;
  recorded_at: string;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const prefix = `${user.id}/`;
  if (!input.storagePath.startsWith(prefix)) {
    return { success: false, error: "Invalid storage path." };
  }
  const { data, error } = await insertProgressPhoto(
    supabase,
    user.id,
    input.recorded_at,
    input.storagePath
  );
  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.progress);
  return { success: true, id: data!.id };
}

export async function deleteProgressPhotoAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { storage_path, error } = await deleteProgressPhotoRow(supabase, id, user.id);
  if (error) return { success: false, error: error.message };
  if (storage_path) {
    await removeStorageObjects(supabase, [storage_path]);
  }
  revalidatePath(ROUTES.progress);
  return { success: true };
}

export async function updateProfileHeightAction(heightCm: number | null): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (heightCm != null && (Number.isNaN(heightCm) || heightCm < 50 || heightCm > 280)) {
    return { success: false, error: "Height should be between 50 and 280 cm." };
  }
  const { error, rowsUpdated } = await updateProfile(supabase, user.id, {
    height_cm: heightCm,
  });
  if (error) return { success: false, error: error.message };
  if (rowsUpdated === 0) return { success: false, error: "Could not update profile." };
  revalidatePath(ROUTES.progress);
  revalidatePath(ROUTES.account);
  return { success: true };
}

export async function updateProgressGoalsAction(form: {
  goal_weight_kg: number | null;
  goal_body_fat_percent: number | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const gw = form.goal_weight_kg;
  const gf = form.goal_body_fat_percent;
  if (gw != null && (Number.isNaN(gw) || gw < 0 || gw > 500))
    return { success: false, error: "Goal weight out of range." };
  if (gf != null && (Number.isNaN(gf) || gf < 0 || gf > 100))
    return { success: false, error: "Goal body fat out of range." };
  const { error, rowsUpdated } = await updateProfile(supabase, user.id, {
    goal_weight_kg: gw,
    goal_body_fat_percent: gf,
  });
  if (error) return { success: false, error: error.message };
  if (rowsUpdated === 0) return { success: false, error: "Could not update profile." };
  revalidatePath(ROUTES.progress);
  revalidatePath(ROUTES.account);
  return { success: true };
}
