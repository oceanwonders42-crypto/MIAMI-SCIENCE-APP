/**
 * Checkout preparation and order creation boundary.
 * Builds payload from cart + form and creates order via WooCommerce (same as website).
 * Does not complete payment in app.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getWooCommerceConfig, createOrder, type CreateOrderPayload } from "./integrations/woocommerce-client";
import { getCartWithItems } from "./cart";
import { getCustomerMappingByUserId } from "./customer-mapping";

export interface CheckoutFormData {
  billing_first_name: string;
  billing_last_name: string;
  billing_address_1: string;
  billing_city: string;
  billing_state: string;
  billing_postcode: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_same_as_billing: boolean;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address_1: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postcode: string;
  shipping_country: string;
  coupon_code: string;
}

export type SubmitCheckoutResult =
  | { ok: true; order_id: string; order_number?: string; message: string }
  | { ok: false; error: string };

/**
 * Build WooCommerce order from cart + form and create order via API.
 * Requires products to have external_id (WooCommerce product id). Does not complete payment.
 */
export async function submitCheckout(
  supabase: SupabaseClient,
  userId: string,
  form: CheckoutFormData
): Promise<SubmitCheckoutResult> {
  const config = getWooCommerceConfig();
  if (!config) return { ok: false, error: "Store not configured" };

  const cartData = await getCartWithItems(supabase, userId);
  if (!cartData || cartData.items.length === 0) {
    return { ok: false, error: "Cart is empty" };
  }

  const line_items: Array<{ product_id: number; quantity: number }> = [];
  for (const item of cartData.items) {
    const wooId = item.product.external_id
      ? parseInt(String(item.product.external_id), 10)
      : NaN;
    if (Number.isNaN(wooId)) {
      return { ok: false, error: `Product "${item.product.name}" is not linked to the store.` };
    }
    line_items.push({ product_id: wooId, quantity: item.quantity });
  }

  const mapping = await getCustomerMappingByUserId(supabase, userId);
  const customer_id = mapping?.woo_customer_id ?? undefined;
  const billing_email = form.billing_email.trim() || (mapping?.customer_email ?? "");

  const billing = {
    first_name: form.billing_first_name.trim() || "Customer",
    last_name: form.billing_last_name.trim() || "—",
    address_1: form.billing_address_1.trim() || "—",
    city: form.billing_city.trim() || "—",
    state: form.billing_state.trim() || undefined,
    postcode: form.billing_postcode.trim() || "—",
    country: form.billing_country.trim() || "US",
    email: billing_email || "noreply@example.com",
    phone: form.billing_phone.trim() || undefined,
  };

  const shipping = form.shipping_same_as_billing
    ? {
        first_name: billing.first_name,
        last_name: billing.last_name,
        address_1: billing.address_1,
        city: billing.city,
        state: billing.state,
        postcode: billing.postcode,
        country: billing.country,
      }
    : {
        first_name: form.shipping_first_name.trim() || billing.first_name,
        last_name: form.shipping_last_name.trim() || billing.last_name,
        address_1: form.shipping_address_1.trim() || billing.address_1,
        city: form.shipping_city.trim() || billing.city,
        state: form.shipping_state.trim() || undefined,
        postcode: form.shipping_postcode.trim() || billing.postcode,
        country: form.shipping_country.trim() || billing.country,
      };

  const payload: CreateOrderPayload = {
    line_items,
    billing,
    shipping,
    customer_id,
    status: "pending",
    coupon_code: form.coupon_code.trim() || undefined,
  };

  const result = await createOrder(config, payload);
  if (!result.ok) return { ok: false, error: result.error };

  const order = result.data;
  const order_id = String(order.id);
  const order_number = order.number != null ? String(order.number) : order_id;
  return {
    ok: true,
    order_id,
    order_number,
    message: "Order created. Payment must be completed on the website or as instructed by the store.",
  };
}
