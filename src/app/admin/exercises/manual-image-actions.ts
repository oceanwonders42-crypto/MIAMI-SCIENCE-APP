"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { isValidImageUrl } from "@/lib/exercises";

const BUCKET = "exercise-images";
const MAX_FILE_BYTES = 12 * 1024 * 1024;

function safeSlugForPath(slug: string): string {
  const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return s || "exercise";
}

export type ManualImageResult =
  | { ok: true; imageUrl: string }
  | { ok: false; error: string };

/**
 * Upload JPG/PNG to exercise-images bucket at `{slug}.jpg` or `{slug}.png`, then set exercises.image_url.
 */
export async function uploadExerciseImageFileAction(
  exerciseId: string,
  formData: FormData
): Promise<ManualImageResult> {
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
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !row) {
    return { ok: false, error: "Exercise not found" };
  }

  const file = formData.get("file");
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return { ok: false, error: "No file uploaded" };
  }
  const f = file as File;
  const mime = (f.type || "").toLowerCase();
  if (mime !== "image/jpeg" && mime !== "image/png") {
    return { ok: false, error: "Only JPG or PNG images are allowed" };
  }
  if (f.size > MAX_FILE_BYTES) {
    return { ok: false, error: `File too large (max ${MAX_FILE_BYTES / (1024 * 1024)} MB)` };
  }

  const ext = mime === "image/png" ? "png" : "jpg";
  const contentType = mime === "image/png" ? "image/png" : "image/jpeg";
  const path = `${safeSlugForPath(row.slug)}.${ext}`;

  let buffer: ArrayBuffer;
  try {
    buffer = await f.arrayBuffer();
  } catch {
    return { ok: false, error: "Could not read file" };
  }

  const service = createServiceRoleClient();
  const { error: upErr } = await service.storage.from(BUCKET).upload(path, new Uint8Array(buffer), {
    contentType,
    upsert: true,
  });
  if (upErr) {
    return { ok: false, error: `Storage: ${upErr.message}` };
  }

  const { data: pub } = service.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl;
  if (!isValidImageUrl(publicUrl)) {
    return { ok: false, error: "Could not build public URL for upload" };
  }

  const { error: dbErr } = await service
    .from("exercises")
    .update({ image_url: publicUrl } as never)
    .eq("id", id);
  if (dbErr) {
    return { ok: false, error: `Database: ${dbErr.message}` };
  }

  return { ok: true, imageUrl: publicUrl };
}

/** Set exercises.image_url from an external https URL (no upload). */
export async function setExerciseImageUrlAction(
  exerciseId: string,
  imageUrl: string
): Promise<ManualImageResult> {
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

  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "URL is required" };
  }
  if (!isValidImageUrl(trimmed)) {
    return { ok: false, error: "URL must start with https:// (or http:// in development)" };
  }

  const service = createServiceRoleClient();
  const { error: dbErr } = await service
    .from("exercises")
    .update({ image_url: trimmed } as never)
    .eq("id", id);
  if (dbErr) {
    return { ok: false, error: `Database: ${dbErr.message}` };
  }

  return { ok: true, imageUrl: trimmed };
}
