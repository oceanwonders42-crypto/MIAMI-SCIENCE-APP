"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";
import {
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  getCartCount,
} from "@/lib/cart";

export type CartActionResult =
  | { ok: true; quantity?: number }
  | { ok: false; error: string };

export async function addToCartAction(
  productId: string,
  quantity: number = 1
): Promise<CartActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  return addToCart(supabase, user.id, productId, quantity);
}

export async function removeFromCartAction(productId: string): Promise<CartActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  return removeFromCart(supabase, user.id, productId);
}

export async function updateCartQuantityAction(
  productId: string,
  quantity: number
): Promise<CartActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  return updateCartItemQuantity(supabase, user.id, productId, quantity);
}

export async function clearCartAction(): Promise<CartActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  return clearCart(supabase, user.id);
}

export async function getCartCountAction(): Promise<number> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  return getCartCount(supabase, user.id);
}
