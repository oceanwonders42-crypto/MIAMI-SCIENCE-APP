import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types";

export async function getFavoriteProductIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("product_id")
    .eq("user_id", userId);
  if (error) return new Set();
  const ids = (data ?? []).map((r: { product_id: string }) => r.product_id);
  return new Set(ids);
}

export async function getFavoritesWithProducts(
  supabase: SupabaseClient,
  userId: string
): Promise<Product[]> {
  const { data: favs, error: fe } = await supabase
    .from("user_favorites")
    .select("product_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (fe || !favs?.length) return [];
  const ids = (favs as { product_id: string }[]).map((f) => f.product_id);
  const { data: products, error: pe } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);
  if (pe) return [];
  const order = new Map(ids.map((id, i) => [id, i]));
  return (products ?? []).sort(
    (a, b) => (order.get((a as Product).id) ?? 0) - (order.get((b as Product).id) ?? 0)
  ) as Product[];
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("user_favorites").upsert(
    { user_id: userId, product_id: productId },
    { onConflict: "user_id,product_id" }
  );
  return { error: error ? new Error(error.message) : null };
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  return { error: error ? new Error(error.message) : null };
}
