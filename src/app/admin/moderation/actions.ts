"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { updateReportStatus } from "@/lib/moderation";
import { revalidatePath } from "next/cache";

export async function reviewReportAction(
  reportId: string,
  status: "reviewed" | "dismissed"
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const role = await getRole(supabase, user.id);
  if (role !== "admin") return { success: false, error: "Admin only" };

  const { error } = await updateReportStatus(
    supabase,
    reportId,
    status,
    user.id
  );
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
  return { success: true };
}
