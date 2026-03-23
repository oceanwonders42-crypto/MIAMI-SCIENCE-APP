import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressPhoto } from "@/types/database";
import { PROGRESS_PHOTOS_BUCKET } from "@/lib/progress-constants";

export async function listProgressPhotos(
  supabase: SupabaseClient,
  userId: string,
  limit = 60
): Promise<ProgressPhoto[]> {
  const { data, error } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ProgressPhoto[];
}

export async function insertProgressPhoto(
  supabase: SupabaseClient,
  userId: string,
  recordedAt: string,
  storagePath: string
): Promise<{ data: ProgressPhoto | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("progress_photos")
    .insert({
      user_id: userId,
      recorded_at: recordedAt,
      storage_path: storagePath,
    })
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ProgressPhoto, error: null };
}

export async function deleteProgressPhotoRow(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<{ storage_path: string | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { storage_path: null, error: new Error(error.message) };
  if (!data) return { storage_path: null, error: new Error("Not found") };
  const path = (data as { storage_path: string }).storage_path;
  const { error: delErr } = await supabase.from("progress_photos").delete().eq("id", id).eq("user_id", userId);
  if (delErr) return { storage_path: null, error: new Error(delErr.message) };
  return { storage_path: path, error: null };
}

export async function removeStorageObjects(
  supabase: SupabaseClient,
  paths: string[]
): Promise<{ error: Error | null }> {
  if (paths.length === 0) return { error: null };
  const { error } = await supabase.storage.from(PROGRESS_PHOTOS_BUCKET).remove(paths);
  return { error: error ? new Error(error.message) : null };
}

export type ProgressPhotoSigned = ProgressPhoto & { signedUrl: string | null };

export async function signProgressPhotoUrls(
  supabase: SupabaseClient,
  photos: ProgressPhoto[],
  expiresSec = 3600
): Promise<ProgressPhotoSigned[]> {
  const out: ProgressPhotoSigned[] = [];
  for (const p of photos) {
    const { data, error } = await supabase.storage
      .from(PROGRESS_PHOTOS_BUCKET)
      .createSignedUrl(p.storage_path, expiresSec);
    out.push({
      ...p,
      signedUrl: error ? null : (data?.signedUrl ?? null),
    });
  }
  return out;
}
