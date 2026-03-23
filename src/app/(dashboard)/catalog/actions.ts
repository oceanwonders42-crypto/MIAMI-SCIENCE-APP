"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { addFavorite, removeFavorite } from "@/lib/favorites";
import { ROUTES } from "@/lib/constants";
import { runProductSync, type ProductSyncResult } from "@/lib/integrations/product-sync";

export type CatalogProductSyncActionResult =
  | { ok: true; result: ProductSyncResult }
  | { ok: false; error: string };

/** Same as Admin → Product sync; admin-only. Revalidates catalog. */
export async function runCatalogProductSyncAction(): Promise<CatalogProductSyncActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    return { ok: false, error: "Only an admin can sync products from WooCommerce." };
  }

  const serviceClient = createServiceRoleClient();
  const outcome = await runProductSync(serviceClient);

  if (!outcome.ok) return { ok: false, error: outcome.error };
  revalidatePath("/catalog", "layout");
  return { ok: true, result: outcome };
}

export async function addFavoriteAction(productId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await addFavorite(supabase, user.id, productId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/catalog");
  revalidatePath("/catalog/[id]", "page");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeFavoriteAction(productId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await removeFavorite(supabase, user.id, productId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/catalog");
  revalidatePath("/catalog/[id]", "page");
  revalidatePath("/dashboard");
  return { ok: true };
}
