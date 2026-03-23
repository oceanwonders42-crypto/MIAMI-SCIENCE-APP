"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import type { Announcement } from "@/types";

async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect(ROUTES.dashboard);
  return supabase;
}

export async function listAnnouncementsAdmin(): Promise<Announcement[]> {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Announcement[];
}

export async function createAnnouncementAction(input: {
  title: string;
  body: string;
  publishedAtIso: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title.trim(),
      body: input.body.trim() || null,
      published_at: input.publishedAtIso,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath(ROUTES.adminAnnouncements);
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateAnnouncementAction(
  id: string,
  input: {
    title: string;
    body: string;
    publishedAtIso: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("announcements")
    .update({
      title: input.title.trim(),
      body: input.body.trim() || null,
      published_at: input.publishedAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath(ROUTES.adminAnnouncements);
  return { ok: true };
}

export async function setAnnouncementPublishedAtAction(
  id: string,
  publishedAtIso: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("announcements")
    .update({
      published_at: publishedAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath(ROUTES.adminAnnouncements);
  return { ok: true };
}

export async function deleteAnnouncementAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath(ROUTES.adminAnnouncements);
  return { ok: true };
}

export async function getAnnouncementByIdAdmin(id: string): Promise<Announcement | null> {
  const supabase = await requireAdmin();
  const { data } = await supabase.from("announcements").select("*").eq("id", id).maybeSingle();
  return (data as Announcement | null) ?? null;
}
