# Miami Science Tracker — Soft Beta Launch Runbook

Operator runbook for launching soft beta. No code changes; operational and integration focus.

---

## 1. PRE-LAUNCH CHECKLIST

- [ ] **Supabase**
  - Project live; URL and anon key set in app env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - All migrations applied (through `00020_seed_exercises.sql` or current latest).
  - Auth: Email signup/signin enabled; redirect URLs include production app URL.
  - RLS enabled on all tables; no service role key in client.

- [ ] **App env (production)**
  - `NEXT_PUBLIC_APP_URL` = production app URL (e.g. `https://app.example.com`).
  - `NEXT_PUBLIC_STORE_URL` / `SHOP_REFILL_URL` = Miami Science store URL (e.g. `https://mia-science.com`).
  - Optional: `NEXT_PUBLIC_STORE_ORDERS_URL` for “Open store account” link.

- [ ] **WooCommerce (store integration)**
  - `WOOCOMMERCE_URL` = store base URL (no trailing slash).
  - `WOOCOMMERCE_CONSUMER_KEY` and `WOOCOMMERCE_CONSUMER_SECRET` = valid API credentials (read/write orders).
  - Store webhook secret (if using signature verification) set in app (e.g. `WOOCOMMERCE_WEBHOOK_SECRET` or equivalent in store-config).

- [ ] **Exercise library**
  - Migration `00020_seed_exercises.sql` applied so browse/library has seeded exercises.

- [ ] **Catalog**
  - Admin → Product sync run at least once so catalog has products with `external_id` (WooCommerce product id).

- [ ] **Smoke test**
  - One signup → onboarding → dashboard → training (start workout, log set) → catalog → add to cart → checkout (test or real). Confirm order appears on Orders page.

---

## 2. FIRST-DAY TESTS

Run these the day soft beta opens (and repeat after any env or store change):

| # | Test | Pass criteria |
|---|------|----------------|
| 1 | **Anonymous** | Open app URL → redirect to login. Sign up link works. |
| 2 | **Signup → onboarding** | New email signup → redirect to onboarding. Complete profile → redirect to dashboard. |
| 3 | **Training** | Start workout → Add exercise → log set (name, sets, reps, weight) → Save → entry appears. Rest timer runs. |
| 4 | **Browse** | Training → Browse all → search + filters work. Open exercise → “Add to new workout” opens session with name pre-filled. |
| 5 | **Catalog & cart** | Catalog shows products. Add to cart → Cart shows items. Proceed to checkout. |
| 6 | **Checkout** | Submit checkout with valid billing → success page with order id/number. No “Store not configured” or API error. |
| 7 | **Order in app** | Orders page shows the order just placed (same browser/session). |
| 8 | **Rewards** | Rewards page loads. If balance ≥ 100, redeem one option → success and balance update. |
| 9 | **Account** | Account loads; profile and notification preferences save. Store/order linkage section visible. |
| 10 | **Admin** (if applicable) | Admin user can open Admin → Product sync, Integrations, Notifications. Product sync completes without fatal error. |

---

## 3. LIVE MONITORING CHECKLIST

- **Auth**: Signup/login success rate; Supabase Auth dashboard for errors or spikes.
- **Orders**: New orders in app (Orders page) vs orders created on store (WooCommerce or store admin). Investigate if in-app checkout orders are missing.
- **Checkout**: User reports of “Store not configured”, “Cart is empty” after adding items, or generic submit errors → check WooCommerce env and API.
- **Catalog**: Catalog empty after a product sync or store update → run Product sync; check products have `external_id`.
- **Webhooks**: If using store webhooks (order/shipment), check webhook endpoint logs (e.g. `/api/webhooks/store/order`, `/api/webhooks/store/shipment`) for 4xx/5xx or signature failures.
- **Errors**: App logs / error tracking for 500s or unhandled rejections on critical paths (auth, checkout, order sync, rewards redemption).

---

## 4. WHAT TO DO IF CHECKOUT FAILS

1. **User sees “Store not configured” or submit does nothing**
   - Confirm `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET` are set in the running app env (restart app after changing env).
   - Verify credentials in WooCommerce (WooCommerce → Settings → Advanced → REST API): key must have read/write.

2. **“Product X is not linked to the store”**
   - Catalog products must have `external_id` = WooCommerce product id. Run Admin → Product sync; if still missing, fix product sync or set `external_id` in DB for that product.

3. **“Cart is empty”**
   - User may have emptied cart or session changed. Have them add items again from Catalog and retry. If it recurs, check cart RLS and that `getCartWithItems` returns items for that user.

4. **WooCommerce API error (4xx/5xx)**
   - Check response body/message. Typical: wrong URL, bad credentials, invalid payload (e.g. missing required billing field). Fix env or form (billing email/address required). Retry checkout.

---

## 5. WHAT TO DO IF ORDERS DO NOT APPEAR

1. **Order was placed via in-app checkout**
   - App syncs order immediately after create via `syncWooOrderToApp`. If order is missing:
     - Confirm WooCommerce env is set (same as in §4). Sync calls `fetchOrderById`; if that fails, order won’t be written.
     - Check app logs for sync errors (e.g. “WooCommerce not configured”, API error). Fix env and have user refresh Orders.
     - In rare cases, order was created in WooCommerce but sync failed: find order in WooCommerce by id/number, then run any one-off sync or backfill if you have a script; otherwise document and fix sync for next time.

2. **Order was placed on the store (not in-app)**
   - Those orders appear only when the store sends a webhook or you run a backfill. If webhooks are configured, see §7. Otherwise, orders from the website won’t show in app until you add webhook or backfill.

3. **User doesn’t see their order**
   - Orders are filtered by `user_id`. In-app checkout sets `user_id` from the logged-in user. If user was logged out or switched account, they won’t see that order. Confirm they’re on the same account that checked out.

---

## 6. WHAT TO DO IF CATALOG IS EMPTY

1. **Run product sync**
   - Admin → Product sync → Run product sync. Wait for completion. Refresh Catalog.

2. **Sync runs but catalog still empty**
   - WooCommerce env must be set (same as checkout). Sync fetches products from WooCommerce and upserts into app `products` table. Check sync result message or logs for API errors.
   - Confirm WooCommerce has published products and sync is not filtering them out (e.g. by category) if you use filters.

3. **Products exist but “not linked to the store” at checkout**
   - Products need `external_id` (WooCommerce product id). Sync should set this. If not, check product-sync logic and that WooCommerce product id is stored in `products.external_id`.

---

## 7. WHAT TO DO IF WEBHOOKS FAIL

1. **Confirm webhook is configured on the store**
   - Store (e.g. WooCommerce) must send order created/updated (and optionally shipment) events to the app URL, e.g. `https://<app>/api/webhooks/store/order`. Payload and signature (if used) must match what the app expects.

2. **Signature / auth errors (401/403)**
   - App verifies signature using a shared secret. Ensure the secret in app env matches the one configured in the store. Fix one or the other and retry.

3. **4xx/500 from app**
   - Check app logs for the webhook route. Common: invalid JSON, missing required fields, or DB error (e.g. RLS, duplicate key). Fix payload or app logic; store may retry depending on its policy.

4. **Orders/shipments still not updating**
   - Webhooks update or create orders/shipments by `external_id`. If webhook succeeds (200) but data is wrong, check mapping (e.g. `user_id` resolution) and payload shape in store-sync logic. For orders created in-app, sync is done at checkout time; webhook is supplementary for later updates.

---

## 8. SOFT BETA LAUNCH DECISION

- **Go** if:
  - Pre-launch checklist is done.
  - First-day tests (at least 1–7) pass in production-like env.
  - WooCommerce env is set and one real or test checkout succeeds with order visible in app.
  - You have a way to monitor errors (logs or tooling) and someone to run §4–§7 if issues appear.

- **No-go** if:
  - Supabase or auth is broken (signup/login failing).
  - Checkout always fails and WooCommerce config cannot be fixed quickly.
  - Orders from in-app checkout never appear and sync cannot be fixed (blocking trust in “order in app”).

- **Soft beta = limited audience**: Invite a small group; monitor first 24–48h; fix operational issues (env, webhooks, sync) before widening. No code change required for runbook items unless you add new tooling or scripts.
