"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { tryAutoLinkCustomer } from "@/lib/integrations/auto-customer-link";

/**
 * Dev/demo only: seeds one order, one shipment, and two reward ledger entries for the current user.
 * Only runs when NODE_ENV === 'development' and NEXT_PUBLIC_ALLOW_DEMO_SEED === 'true'.
 * Do not enable in production.
 */
export async function seedDemoCommerceData(): Promise<
  | { success: true; message: string }
  | { success: false; error: string }
> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "Not available" };
  }
  if (process.env.NEXT_PUBLIC_ALLOW_DEMO_SEED !== "true") {
    return { success: false, error: "Demo seed not enabled" };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      order_number: "MS-DEMO-1",
      external_id: "demo-1",
      status: "delivered",
      total_cents: 5999,
      currency: "USD",
      item_count: 2,
      shop_url: null,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return {
      success: false,
      error: orderError?.message ?? "Failed to create order",
    };
  }

  await supabase.from("shipments").insert({
    order_id: order.id,
    carrier: "USPS",
    tracking_number: "9400111899561234567890",
    status: "delivered",
    shipped_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_delivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    delivered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await supabase.from("reward_points_ledger").insert([
    {
      user_id: user.id,
      amount_delta: 150,
      reason: "purchase",
      description: "Points from demo order",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: user.id,
      amount_delta: 50,
      reason: "signup_bonus",
      description: "Welcome bonus",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/rewards");
  return { success: true, message: "Demo data added. Refresh to see orders and rewards." };
}

/**
 * Retry WooCommerce customer auto-link by email (same as dashboard layout bootstrap).
 * Uses service role; safe to call from authenticated user only.
 */
export async function retryStoreAutoLinkAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { ok: false, message: "Sign in to connect your store account." };
  }

  let service;
  try {
    service = createServiceRoleClient();
  } catch {
    return {
      ok: false,
      message: "Connection unavailable. Try again later.",
    };
  }

  const result = await tryAutoLinkCustomer(service, user.id, user.email);

  revalidatePath("/orders");
  revalidatePath("/dashboard");

  if (result.linked) {
    return {
      ok: true,
      message:
        result.ordersImported > 0
          ? `Store linked. Imported ${result.ordersImported} order(s).`
          : "Store account connected. Your orders will sync as they update.",
    };
  }

  switch (result.reason) {
    case "already_mapped":
      return { ok: true, message: "Your store account is already connected." };
    case "no_email":
      return { ok: false, message: "Add an email to your account to link the store." };
    case "throttled":
      return {
        ok: false,
        message: "We recently tried to link your account. Please try again in up to 24 hours.",
      };
    case "no_match":
      return {
        ok: false,
        message:
          "No matching mia-science.com customer found for your email. Use the same email as checkout, or contact support.",
      };
    case "multiple_matches":
      return {
        ok: false,
        message: "Multiple store profiles match this email. Contact support to link your account.",
      };
    case "woo_taken":
      return {
        ok: false,
        message: "This store customer is already linked to another app account.",
      };
    case "config":
      return { ok: false, message: "Store integration is not configured." };
    default:
      return {
        ok: false,
        message: result.error ?? "Could not connect. Try again later.",
      };
  }
}
