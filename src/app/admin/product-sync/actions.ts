"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { runProductSync, type ProductSyncResult } from "@/lib/integrations/product-sync";

export type ProductSyncActionResult =
  | { ok: true; result: ProductSyncResult }
  | { ok: false; error: string };

export async function runProductSyncAction(): Promise<ProductSyncActionResult> {
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
  const outcome = await runProductSync(serviceClient);

  if (!outcome.ok) return { ok: false, error: outcome.error };
  revalidatePath("/catalog", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/product-sync");
  return { ok: true, result: outcome };
}
