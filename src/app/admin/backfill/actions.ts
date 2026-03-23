"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { runWooCommerceBackfill } from "@/lib/integrations/woocommerce-backfill";
import type { BackfillResult } from "@/lib/integrations/woocommerce-backfill";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type BackfillActionResult =
  | { ok: true; result: BackfillResult }
  | { ok: false; error: string };

export async function runBackfillAction(): Promise<BackfillActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    return { ok: false, error: "Admin only" };
  }

  const serviceClient = createServiceRoleClient();
  const outcome = await runWooCommerceBackfill(serviceClient);

  if (!outcome.ok) return { ok: false, error: outcome.error };
  revalidatePath("/admin");
  revalidatePath("/admin/backfill");
  return { ok: true, result: outcome };
}
