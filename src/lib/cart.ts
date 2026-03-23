import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cart, CartItem, Product } from "@/types";

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface CartWithItems {
  cart: Cart;
  items: CartItemWithProduct[];
}

/** Get or create cart for user. */
export async function getOrCreateCart(
  supabase: SupabaseClient,
  userId: string
): Promise<Cart | null> {
  const { data: existing } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing as Cart;
  const { data: inserted, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error) return null;
  return inserted as Cart;
}

/** Get cart with items and product details for display. */
export async function getCartWithItems(
  supabase: SupabaseClient,
  userId: string
): Promise<CartWithItems | null> {
  const cart = await getOrCreateCart(supabase, userId);
  if (!cart) return null;
  const { data: rows, error } = await supabase
    .from("cart_items")
    .select("id, cart_id, product_id, quantity, created_at")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });
  if (error) return { cart, items: [] };
  const itemRows = (rows ?? []) as CartItem[];
  if (itemRows.length === 0) return { cart, items: [] };
  const productIds = [...new Set(itemRows.map((i) => i.product_id))];
  const { data: productsData } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);
  const productsMap = new Map(
    ((productsData ?? []) as Product[]).map((p) => [p.id, p])
  );
  const items: CartItemWithProduct[] = itemRows.map((item) => ({
    ...item,
    product: productsMap.get(item.product_id) ?? ({} as Product),
  }));
  return { cart, items };
}

/** Add to cart or increment quantity. Returns updated item count for product. */
export async function addToCart(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<{ ok: true; quantity: number } | { ok: false; error: string }> {
  if (quantity < 1) return { ok: false, error: "Quantity must be at least 1" };
  const cart = await getOrCreateCart(supabase, userId);
  if (!cart) return { ok: false, error: "Could not get cart" };
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    const newQty = (existing as { quantity: number }).quantity + quantity;
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", (existing as { id: string }).id);
    if (error) return { ok: false, error: error.message };
    const { error: touch } = await supabase
      .from("carts")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cart.id);
    if (touch) { /* non-fatal */ }
    return { ok: true, quantity: newQty };
  }
  const { error } = await supabase.from("cart_items").insert({
    cart_id: cart.id,
    product_id: productId,
    quantity,
  });
  if (error) return { ok: false, error: error.message };
  const { error: touch } = await supabase
    .from("carts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", cart.id);
  if (touch) { /* non-fatal */ }
  return { ok: true, quantity };
}

/** Remove one product from cart. */
export async function removeFromCart(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cart = await getOrCreateCart(supabase, userId);
  if (!cart) return { ok: false, error: "Could not get cart" };
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id)
    .eq("product_id", productId);
  if (error) return { ok: false, error: error.message };
  const { error: touch } = await supabase
    .from("carts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", cart.id);
  if (touch) { /* non-fatal */ }
  return { ok: true };
}

/** Update quantity for a product in cart. */
export async function updateCartItemQuantity(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  quantity: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (quantity < 1) return removeFromCart(supabase, userId, productId);
  const cart = await getOrCreateCart(supabase, userId);
  if (!cart) return { ok: false, error: "Could not get cart" };
  const { data: row } = await supabase
    .from("cart_items")
    .select("id")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Item not in cart" };
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", (row as { id: string }).id);
  if (error) return { ok: false, error: error.message };
  const { error: touch } = await supabase
    .from("carts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", cart.id);
  if (touch) { /* non-fatal */ }
  return { ok: true };
}

/** Clear all items in cart. */
export async function clearCart(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cart = await getOrCreateCart(supabase, userId);
  if (!cart) return { ok: false, error: "Could not get cart" };
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id);
  if (error) return { ok: false, error: error.message };
  const { error: touch } = await supabase
    .from("carts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", cart.id);
  if (touch) { /* non-fatal */ }
  return { ok: true };
}

/** Count items in cart (sum of quantities). For badge display. */
export async function getCartCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const cart = await getOrCreateCart(supabase, userId);
  if (!cart) return 0;
  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cart.id);
  if (error) return 0;
  return (data ?? []).reduce((sum, r) => sum + ((r as { quantity: number }).quantity ?? 0), 0);
}
