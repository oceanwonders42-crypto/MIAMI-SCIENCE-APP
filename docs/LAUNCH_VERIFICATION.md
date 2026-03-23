# Miami Science Tracker — Final Launch Verification

**Scope:** End-to-end launch readiness. No redesign. Fix only true blockers. Be strict and practical.

---

## 1. LAUNCH FLOW CHECKLIST

Use this as the master checklist. Each item is a concrete verification step.

### 1. Signup / login / onboarding

- [ ] **L1** Unauthenticated visit to `/` redirects to `/login`.
- [ ] **L2** Sign up (email + password) creates account; after signup user is redirected (dashboard or onboarding).
- [ ] **L3** Log in with valid credentials redirects to `/onboarding` if profile incomplete, else `/dashboard`.
- [ ] **L4** Profile incomplete = `full_name` or `display_name` missing/empty in `profiles`. Completing both and submitting "Complete setup" redirects to `/dashboard`.
- [ ] **L5** Direct hit to `/dashboard` with incomplete profile redirects to `/onboarding`.
- [ ] **L6** Forgot password: submit email → success message; no crash (email delivery is external).

### 2. Dashboard

- [ ] **L7** Logged-in user with complete profile sees dashboard; sections load (Today, What needs attention, Training, Stack, Orders, Favorites, etc.) without error.
- [ ] **L8** Section links (Training →, Stack →, Orders →, Catalog →, Rewards →) navigate correctly.
- [ ] **L9** Today block CTA (check-in or Log workout) goes to `/training`.

### 3. Workout logging

- [ ] **L10** From Training, open "Log workout" (or equivalent); form accepts type, date, notes; add at least one exercise with weight/reps; submit → new workout appears and stats update.
- [ ] **L11** Existing workouts list; expand/open a workout; no crash. Edit/delete if available works.

### 4. Supply tracking

- [ ] **L12** Stack page loads; add a supply (name, quantity, threshold); it appears in list and in summary stats.
- [ ] **L13** Edit supply (quantity/threshold); delete supply; list and summary update. No crash.

### 5. Catalog with synced Miami Science products

- [ ] **L14** Catalog page loads. If product sync has been run: products from `products` table appear (from WooCommerce sync). If never synced: empty state with "Shop at mia-science.com" etc.
- [ ] **L15** Product detail `/catalog/[id]` loads for a valid product id; name, price, image (or placeholder), Buy / Add to cart work.

### 6. Favorites

- [ ] **L16** From catalog or product detail, toggle favorite (heart); dashboard Favorites block and catalog "Your favorites" reflect it. Unfavorite removes it.

### 7. Cart

- [ ] **L17** Add to cart from catalog/product detail; go to `/cart`; item appears with correct name, quantity, price. Change quantity or remove; subtotal updates.
- [ ] **L18** Empty cart shows empty state; "Continue shopping" → catalog. Cart link from Catalog header and from Account works.

### 8. Checkout

- [ ] **L19** With items in cart, go to `/checkout`. Order summary matches cart. Fill required billing (and shipping if not same); submit.
- [ ] **L20** Checkout success: redirect to `/checkout/success?order_id=...` (and optionally `order_number=...`). Confirmation message and links (View orders, Continue shopping) work. Cart is empty after success.
- [ ] **L21** Empty cart → open `/checkout` → redirect to `/cart`. Logged out → `/checkout` or `/cart` → redirect to `/login`.
- [ ] **L22** If a product in cart has no `external_id`: checkout returns error "Product ... is not linked to the store." Fix: run admin product sync so products have `external_id` from WooCommerce.

### 9. Orders visibility

- [ ] **L23** After successful in-app checkout, Orders page shows the new order (order number, date, total, status). If not visible within a short time: check sync (submitCheckoutAction → syncWooOrderToApp) and that order has `user_id` set.
- [ ] **L24** Orders list is filtered by `user_id`; only current user's orders appear.

### 10. Shipment visibility

- [ ] **L25** Orders page shows shipments per order when data exists. Shipments come from `shipments` table (ShipStation sync or other source). If no shipments: run admin ShipStation sync or confirm orders have shipment data.

### 11. Delivered shipment → add to stack

- [ ] **L26** For an order with a shipment whose status is "delivered", Orders page shows "Add to stack" (and "Update supply →") on that shipment.
- [ ] **L27** Click "Add to stack" → `/orders/shipment/[shipmentId]/add-to-stack`. Page loads; "Add new supply item" (prefill) and "Update existing supply" sections present. Submit add or update → redirect to `/stack?inventoryUpdated=1` and banner shows.
- [ ] **L28** If shipment already has `inventory_updated_at` set: "Add to stack" link is replaced by "Inventory updated"; hitting add-to-stack URL redirects to `/stack?inventoryUpdated=1`.
- [ ] **L29** Invalid or non-delivered shipment ID → add-to-stack redirects to `/orders`. Not own order → redirect to `/orders`.

### 12. Rewards redemption

- [ ] **L30** Rewards page shows balance and history. If balance ≥ 100 (or 250): "Redeem" for an option works; success message; balance decreases; new ledger entry (Redeemed, negative points). Page refresh shows updated balance.
- [ ] **L31** Insufficient balance: Redeem disabled or shows error. No negative balance (RPC prevents it).
- [ ] **L32** Redeem uses `redeem_reward_points` RPC; migration `00018_redeem_reward_points_rpc.sql` must be applied.

### 13. Notifications

- [ ] **L33** Account → Notifications: preferences form loads; toggles save without error. No hard dependency for launch beyond "saves without crash."

### 14. Account / store linkage

- [ ] **L34** Account page loads; Profile, Store account (customer mapping + order count), Cart link, Security, Sign out present. Store account shows "Linked" / "Not linked" and order count when mapping exists.
- [ ] **L35** Customer mapping links app user to WooCommerce customer (by email). Used at checkout for `customer_id` and for backfill order linking. Manual mapping or backfill creates linkage; in-app checkout does not require pre-existing mapping (order gets `user_id` from session).

### 15. Admin: product sync / integrations / mappings

- [ ] **L36** Admin product sync: run "Run product sync" → success (or clear error). Catalog then shows synced products. Products must have `external_id` for checkout line items.
- [ ] **L37** Admin integrations: WooCommerce, ShipStation, Square show Configured/Callable as expected. Env: `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`; `SHIPSTATION_API_KEY` for shipments.
- [ ] **L38** Admin mappings: look up by user ID or email; create/update mapping. Unmatched orders section loads. No crash.
- [ ] **L39** Admin backfill: run backfill (if WooCommerce env set) → creates mappings by email match and upserts orders; unmatched orders get `user_id` null. Idempotent; safe to re-run.

---

## 2. TRUE BLOCKERS TO TEST FIRST

These can prevent launch or core flows. Verify before anything else.

| # | Blocker | What to verify |
|---|--------|----------------|
| **B1** | Auth + profile | L1–L5: anonymous → login; signup → onboarding or dashboard; login → onboarding if profile incomplete; completing full_name + display_name → dashboard; direct dashboard with incomplete profile → redirect to onboarding. |
| **B2** | Checkout → order creation | L19–L22: checkout with valid cart and billing succeeds; success page shows; cart empty; order appears on Orders (L23). If "Store not configured": set `WOOCOMMERCE_*`. If "Product ... is not linked": run product sync so products have `external_id`. |
| **B3** | Orders visibility after checkout | L23–L24: order created at checkout has `user_id` (syncWooOrderToApp passes userId). If order missing: check sync error in submitCheckoutAction; check RLS/insert on `orders`. |
| **B4** | Catalog + cart + checkout dependency | L14–L22: catalog shows products only after product sync. Cart items must reference products with `external_id` for checkout to succeed. Run product sync before testing full purchase flow. |
| **B5** | Rewards redemption | L30–L32: redeem RPC exists and is callable; balance check and insert are atomic. Migration 00018 applied; `GRANT EXECUTE ... TO authenticated` in place. |
| **B6** | Env / Supabase | App needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; server actions that sync/backfill need `SUPABASE_SERVICE_ROLE_KEY`. Checkout needs `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`. |

---

## 3. MOST LIKELY FAILURE POINTS

Where things usually break in this stack. Test these explicitly.

| Area | Risk | What happens | How to avoid / fix |
|------|------|--------------|--------------------|
| **Checkout** | WooCommerce not configured | "Store not configured" → checkout fails | Set `WOOCOMMERCE_*` in env. |
| **Checkout** | Cart product missing `external_id` | "Product X is not linked to the store" | Run admin product sync; ensure WooCommerce products sync to app with `external_id`. |
| **Orders** | Order not visible after checkout | User completes checkout but Orders is empty | syncWooOrderToApp may have failed (network, WooCommerce API); check server logs. Order must have `user_id` for getOrders to return it. |
| **Shipments** | No shipments on orders | Shipment blocks empty | Shipments come from `shipments` table; run ShipStation sync in admin. ShipStation env: `SHIPSTATION_API_KEY`. |
| **Add to stack** | "Add to stack" not shown | Shipment not marked delivered | `isDelivered(shipment)` is true only when status maps to "delivered". ShipStation must set status to delivered when appropriate. |
| **Profile** | Redirect loop or stuck onboarding | Profile considered incomplete | `isProfileComplete`: both `full_name` and `display_name` must be non-empty after trim. Check DB and form save. |
| **Rewards** | Redeem fails or double-spend | RPC error or balance goes negative | Ensure migration 00018 applied; RPC does balance check under lock. Frontend disables redeem when balance < cost. |
| **Catalog** | Empty catalog | No products in `products` table | Run admin product sync from WooCommerce. No fake data; sync is required for in-app catalog. |
| **Customer mapping** | Checkout uses guest or wrong customer | Optional: mapping links user to WooCommerce customer | Checkout works without mapping (order still gets user_id from session). Mapping used for billing customer_id and for backfill. |

---

## 4. EXACT GO/NO-GO TEST ORDER

Run in this order. If a step fails, fix before proceeding.

1. **Env & auth (B1, B6)**  
   - Set Supabase and WooCommerce env.  
   - L1–L5: anonymous → login; signup; login with incomplete profile → onboarding; complete profile → dashboard; direct dashboard incomplete → onboarding.

2. **Catalog & products (B4)**  
   - L36: Admin product sync run successfully.  
   - L14–L15: Catalog shows products; product detail loads.

3. **Cart & checkout (B2, B3)**  
   - L17–L18: Add to cart; cart page; empty cart.  
   - L19–L22: Checkout with filled billing (and shipping if needed); success page; cart empty.  
   - L23–L24: Orders page shows the new order.

4. **Rewards (B5)**  
   - L30–L32: Rewards page; redeem when balance sufficient; balance and history update.

5. **Shipments & add-to-stack**  
   - L25: Orders show shipments (run ShipStation sync if needed).  
   - L26–L29: Delivered shipment shows "Add to stack"; add-to-stack page; submit → redirect to stack with banner; already-updated shipment redirects.

6. **Dashboard & rest**  
   - L7–L9: Dashboard loads; section links work.  
   - L10–L13: Workout log; stack add/edit/delete.  
   - L16: Favorites toggle.  
   - L33–L35: Notifications save; account/store linkage.  
   - L37–L39: Admin integrations, mappings, backfill (no crash).

**Go:** All of 1–6 pass.  
**No-go:** Any of 1–4 fails (auth, catalog/checkout, orders visibility, rewards). Fix blockers then re-run from step 1.

---

## 5. WHAT TO FIX FIRST IF A TEST FAILS

| If this fails | Fix first |
|---------------|-----------|
| **L1–L5 (auth/onboarding)** | Ensure Supabase auth and `profiles` table exist. Check `isProfileComplete`: `full_name` and `display_name` both non-empty. Onboarding form must save to `profiles`. Redirect targets: login, onboarding, dashboard. |
| **L14 / empty catalog** | Run admin product sync. Confirm `WOOCOMMERCE_*` env. Check `products` and `product_links` tables have rows. |
| **L19–L20 / checkout fails** | "Store not configured" → set `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`. "Product ... not linked" → product sync and `external_id` on products. Other API error → check server logs and WooCommerce API/credentials. |
| **L23 / order not on Orders** | Check submitCheckoutAction: syncWooOrderToApp must succeed or at least order creation in WooCommerce succeeded. Order row must have `user_id` (set in sync). Check RLS on `orders`: user can select where `user_id = auth.uid()`. |
| **L25 / no shipments** | Run ShipStation sync in admin. Confirm `SHIPSTATION_API_KEY`; shipments table populated and linked to orders (`order_id`). |
| **L26–L27 / Add to stack missing or broken** | Shipment must have status that maps to "delivered" (isDelivered). Add-to-stack page requires shipment owned by user's order; isDelivered; !isInventoryUpdated. If already updated, redirect to stack. |
| **L30–L31 / redeem fails** | Apply migration 00018 (redeem_reward_points RPC). Grant EXECUTE to authenticated. Check balance in `reward_points_ledger`. Option id must match REDEMPTION_OPTIONS. |
| **L36 / product sync fails** | WooCommerce env; service role client for sync; product-sync normalizes and upserts `products` + `product_links`; products get `external_id`. |

---

*End of Launch Verification. Run the go/no-go order; fix only true blockers; re-verify from step 1 after any fix.*
