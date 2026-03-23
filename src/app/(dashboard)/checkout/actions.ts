"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { ROUTES } from "@/lib/constants";
import { submitCheckout, type CheckoutFormData } from "@/lib/checkout";
import { clearCart } from "@/lib/cart";
import { syncWooOrderToApp } from "@/lib/integrations/woocommerce-order-sync";

export type SubmitCheckoutActionResult =
  | { ok: true; order_id: string; order_number?: string; message: string }
  | { ok: false; error: string };

export async function submitCheckoutAction(
  form: CheckoutFormData
): Promise<SubmitCheckoutActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const result = await submitCheckout(supabase, user.id, form);
  if (!result.ok) return result;

  const serviceClient = createServiceRoleClient();
  const syncResult = await syncWooOrderToApp(
    serviceClient,
    result.order_id,
    user.id
  );
  await clearCart(supabase, user.id);

  const message = syncResult.ok
    ? "Order created. It will appear in Your Orders. Complete payment when you receive the invoice or at the store."
    : "Order created in the store. It may take a moment to appear in Your Orders. Complete payment when you receive the invoice or at the store.";

  return {
    ok: true,
    order_id: result.order_id,
    order_number: result.order_number,
    message,
  };
}
