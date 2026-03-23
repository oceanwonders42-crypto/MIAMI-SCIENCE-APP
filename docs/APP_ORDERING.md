# App ordering — architecture and real checkout flow

How in-app ordering is implemented and how it stays consistent with the website. Orders are real WooCommerce orders; payment is completed via the store’s existing flow (invoice, Square, or website).

## Architecture overview

- **WooCommerce is the source of truth** for commerce. The app does not implement a second order system. Orders created in the app are created via the WooCommerce REST API (`POST /orders`), the same backend that the website uses.
- **Cart** is stored in the app database (`carts`, `cart_items`) and is user-scoped. When the user places an order, the cart is converted into a WooCommerce order via the API; after success, the app cart is cleared and the order is synced into the app’s `orders` table so it appears on the Orders page.
- **Checkout** captures billing/shipping and optional coupon, builds an order payload, and creates the order in WooCommerce (status `pending`). **Payment is not completed inside the app**; the user completes payment via the store’s flow (e.g. invoice, Square, or store account). The success page and Orders page keep the result visible.

## Cart model choice

The app uses a **DB-backed cart** (Supabase tables `carts` and `cart_items`):

- **Why not local-only (e.g. localStorage):** Cart would not persist across devices or after reinstall; harder to use as the single source of truth for the order-creation step.
- **Why not hybrid:** Added complexity without a clear benefit for the current scope; DB-backed cart is sufficient and keeps one source of truth.
- **Benefits:** One cart per user; survives refresh and devices; straightforward to read at checkout and send to WooCommerce; RLS keeps carts isolated per user.

## Flow

1. **Catalog / product detail / favorites** — User adds items to cart. Cart is stored in `cart_items`.
2. **Cart page** — User sees items, quantity controls, subtotal, “Continue shopping” and “Proceed to checkout”.
3. **Checkout page** — Order summary, billing/shipping form, optional coupon, “Place order”. Loading and error states are shown during submit.
4. **Order creation** — Server builds payload from cart + form: `line_items` use WooCommerce product IDs (`products.external_id`), billing/shipping from form, optional `customer_id` from `customer_mappings`. `submitCheckout` calls WooCommerce `createOrder` (REST `POST /orders`). Order is created in the store with status `pending`. Then `syncWooOrderToApp` fetches the created order and upserts into the app’s `orders` table so it appears on the Orders page. Cart is cleared.
5. **Success** — User is redirected to `/checkout/success?order_id=...&order_number=...`. Confirmation screen shows order number, payment handoff text (complete payment via invoice or store), and links to “View your orders”, “Open store account”, and “Continue shopping”. Order is visible on the app’s Orders page; shipment/payment sync (webhooks, ShipStation, Square) applies as for any other store order.

## Consistency with website order flow

- **Same API:** Orders are created via the same WooCommerce REST API that a headless or server-side website would use.
- **Same data:** Line items use WooCommerce product IDs; billing/shipping match the structure expected by WooCommerce; optional coupon is sent as `coupon_lines`.
- **Same backend:** No duplicate order logic; WooCommerce remains the single source of truth for orders, inventory, and payments.

## Payment handoff

- Orders are created in WooCommerce as `pending`. Payment is completed outside the app using the store’s existing flow (e.g. Square invoice, payment link, or store checkout). The success page tells the user to complete payment when they receive the invoice or at the store; “Open store account” links to the store’s order history (`STORE_ORDERS_URL`, default `{SHOP_REFILL_URL}/my-account/orders`). If the store uses Square or another downstream payment flow, that flow is unchanged; the app does not duplicate it.

## Safety and consistency

- **Single source of truth:** All orders live in WooCommerce. The app only creates orders via the API and syncs the created order into the app’s `orders` table for visibility.
- **No duplicate orders:** Cart is cleared only after a successful create; the submit button is disabled while the request is in flight. A second submit with an empty cart would fail at “Cart is empty” before calling the API.
- **Product/pricing:** Line items use `products.external_id` (WooCommerce product id). Prices and totals in the app are from the catalog at checkout time; WooCommerce may recalculate tax/shipping. For strict consistency the store can validate on its side.

## Assumptions and limitations

- **Catalog:** Every cart product must have `external_id` set (synced from WooCommerce). Products without it cannot be ordered in the app.
- **Customer link:** If the user has a `customer_mappings` row, `customer_id` is sent so the order is attached to the same store customer as the website.
- **Order sync:** After create, we fetch the order from WooCommerce and upsert into `orders`. If that sync fails, the order still exists in the store; the user is told it may take a moment to appear in the app. Webhooks and ShipStation/Square sync then apply as for any other order.
- **Tax/shipping:** Sent as addresses to WooCommerce; the app does not compute tax or shipping in the UI.

## Files and boundaries

- **Cart:** `src/lib/cart.ts`. Tables: `carts`, `cart_items`.
- **Checkout:** `src/lib/checkout.ts` (submitCheckout: cart + form → createOrder).
- **WooCommerce:** `src/lib/integrations/woocommerce-client.ts` (createOrder → `POST /orders`).
- **Order sync:** `src/lib/integrations/woocommerce-order-sync.ts` (syncWooOrderToApp: fetch order, upsert into `orders`).
- **UI:** Cart page (`/cart`), checkout page (`/checkout`), success page (`/checkout/success`), Add to cart on catalog and product detail.

## Runbook

| Step | Action |
|------|--------|
| Add to cart | Catalog or product detail → “Add to cart”. |
| Checkout | Cart → “Proceed to checkout” → fill form → “Place order”. |
| After place order | Order created in WooCommerce; synced to app Orders; redirect to success page; cart cleared. User completes payment via store/invoice. |
