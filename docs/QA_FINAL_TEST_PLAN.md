# Miami Science Tracker — Final Manual QA Test Plan (Launch)

**Scope:** Launch testing only. No feature work. No redesign. Do not code unless a clear bug is found.

**Routes reference:** `/` (home), `/login`, `/signup`, `/forgot-password`, `/onboarding`, `/dashboard`, `/training`, `/progress`, `/stack`, `/catalog`, `/cart`, `/checkout`, `/checkout/success`, `/orders`, `/orders/shipment/[id]/add-to-stack`, `/rewards`, `/affiliate`, `/community`, `/help`, `/account`, `/admin`, `/admin/integrations`, `/admin/mappings`, `/admin/backfill`, `/admin/product-sync`, `/admin/sync`, `/admin/notifications`, `/admin/affiliates`, `/admin/moderation`, `/admin/qa`.

---

## 1. FINAL QA TEST PLAN

### 1. Auth + onboarding

- **Home redirect (logged out):** Open `/`. Expect redirect to `/login`.
- **Home redirect (logged in, profile incomplete):** Log in as a user with no profile or missing `full_name`/`display_name`. Open `/`. Expect redirect to `/onboarding`.
- **Home redirect (logged in, profile complete):** Log in as a complete user. Open `/`. Expect redirect to `/dashboard`.
- **Login:** Go to `/login`. Enter valid email/password. Submit. Expect redirect to `/onboarding` or `/dashboard` per profile completeness.
- **Login error:** Submit invalid credentials. Expect clear error, no redirect.
- **Sign up:** Go to `/signup`. Create account. After signup, expect redirect to `/onboarding` (profile incomplete).
- **Login ↔ Sign up:** From login, click “Sign up” → `/signup`. From signup, click “Sign in” (if present) → `/login`.
- **Forgot password:** Go to `/forgot-password`. Submit email. Expect success/error message; no crash.
- **Onboarding:** As new/incomplete user, land on `/onboarding`. Fill **Full name** and **Display name** (required). Submit “Complete setup”. Expect redirect to `/dashboard`. Confirm disclaimer text is visible.
- **Onboarding skip:** With incomplete profile, try to open `/dashboard` directly. Expect redirect back to `/onboarding`.
- **Dashboard layout (logged in):** Sidebar (desktop) shows Dashboard, Training, Progress, Stack, Catalog, Cart, Orders, Rewards, Community, Help, Account; Affiliate only if role is affiliate/admin; Admin only if role is admin. Bottom nav (mobile) shows Home, Training, Stack, Orders, Account.

### 2. Dashboard

- **Load:** As logged-in user with complete profile, open `/dashboard`. Page loads without error. Sections visible: Today (check-in/streak), What needs attention, Training, My stack, Orders; lower band: Favorites, Announcements, Rewards, Affiliate (if role allows).
- **Today block:** If check-in or streak CTAs exist, click through to Training or expected destination. Primary CTA is clear and works.
- **Needs attention:** If items exist, click item CTA; expect correct destination (e.g. Stack, Orders). Empty state shows “Nothing needs attention right now.”
- **Training / Stack / Orders section links:** “Training →”, “Stack →”, “Orders →” in section headers go to `/training`, `/stack`, `/orders`.
- **Favorites:** Click product link → catalog product page. “Browse catalog” → `/catalog`. Empty: “No favorites yet” + link to catalog.
- **Announcements:** If any published, they display. Empty: “No announcements right now.”
- **Rewards:** Summary and “Rewards →” link to `/rewards`.
- **Affiliate (if visible):** Link to `/affiliate`.

### 3. Workouts / training

- **Training page:** Open `/training`. Stats visible: This week (workouts, streak, last workout). Personal records (if any). Recent workouts list. Exercise history.
- **Log workout:** Click “Log workout” (or equivalent). Open form, fill type/date/notes, add at least one exercise with sets/reps or weight. Submit. New workout appears in list; stats update.
- **Workout detail:** Expand or open a workout. Entries and values display correctly. Edit/delete if available; no crash.
- **Progress page:** Open `/progress`. Page loads. Any charts or history display without error.
- **Empty state:** New user with no workouts: empty state and “Log workout” CTA; no broken layout.

### 4. Stack / supplies

- **Stack page:** Open `/stack`. Summary stats (Active items, Low, Running low soon, Next runout, Order by) when supplies exist. List of supplies with names, amounts, thresholds, refill info.
- **Add supply:** Open “Add supply” (or Add item). Fill name, quantity, threshold, optional product link. Submit. Item appears in list.
- **Edit/delete supply:** Edit quantity or threshold; delete supply. List and summary update.
- **Inventory-updated banner:** Open `/stack?inventoryUpdated=1`. Green banner “Supply updated…” appears. Dismiss or navigate away.
- **Add from query:** If URL has `?add=1` (or similar), add modal/sheet opens when implemented. No crash.
- **Empty state:** No supplies: “No supplies tracked yet” and Add to stack CTA. Summary hidden or minimal.

### 5. Catalog / favorites

- **Catalog:** Open `/catalog`. If products exist: “Your favorites” (if any) and “Products” / “All products”. Product cards show name, price, Buy link. No products: empty state with “Back to dashboard” link.
- **Product detail:** Click a product → `/catalog/[id]`. Name, category, price, description, image (or “No image”). Favorite toggle and Add to cart (if implemented) work. “Buy” link goes to store URL. “Back to catalog” → `/catalog`.
- **Favorite from catalog:** Toggle heart on product card or detail. Reload or go to dashboard: favorite appears in Favorites block.
- **Unfavorite:** Remove favorite. It disappears from dashboard Favorites and catalog favorites section.

### 6. Cart / checkout

- **Cart empty:** Open `/cart`. Empty state: “Your cart is empty” and “Continue shopping” → `/catalog`. “Back to catalog” link works.
- **Add to cart:** From catalog product page, add to cart. Go to `/cart`. Item appears with name, quantity, price. Subtotal shown. “Continue shopping” and “Proceed to checkout” visible.
- **Update quantity/remove:** Change quantity or remove item. Subtotal and list update.
- **Checkout (empty cart):** With empty cart, open `/checkout` directly. Expect redirect to `/cart`.
- **Checkout form:** With items in cart, open `/checkout`. Order summary matches cart. Fill billing (required fields). Toggle “Shipping same as billing” or fill shipping. Submit. Expect either: redirect to `/checkout/success?order_id=…&order_number=…` or clear error message.
- **Checkout success:** Land on `/checkout/success` with valid `order_id`. Confirmation message and order number (if present). “View your orders” → `/orders`, “Open store account” → external STORE_ORDERS_URL, “Continue shopping” → `/catalog`, “Back to dashboard” → `/dashboard`. Cart is empty after successful checkout.
- **Checkout unauthenticated:** Log out. Open `/checkout` or `/cart`. Expect redirect to `/login`.

### 7. Orders / shipments

- **Orders page:** Open `/orders`. If need refill (stack low/critical), refill banner and “View Stack” appear. Order history: list of orders with number, date, total, status, item count. “Shop now” / “Seed demo” in empty state. “Reorder” / shop link in section.
- **Order card:** Each order shows shipments (if any). Per shipment: status badge, carrier, tracking number, shipped/delivered dates. Delivered shipment: “Add to stack” and “Update supply →” links (or “Inventory updated” if already done).
- **Add to stack from shipment:** From a delivered shipment (not yet marked inventory updated), click “Add to stack” → `/orders/shipment/[shipmentId]/add-to-stack`. Page shows “Add new supply item” (prefilled from order) and “Update existing supply”. Submit add new: redirect to `/stack?inventoryUpdated=1`. Submit update existing: same. “Back to orders” → `/orders`.
- **Add-to-stack guards:** Open `/orders/shipment/[invalid-id]/add-to-stack` or non-delivered shipment → redirect to `/orders`. Already inventory-updated → redirect to `/stack?inventoryUpdated=1`. Not own order → redirect to `/orders`.

### 8. Rewards / redemption

- **Rewards page:** Open `/rewards`. Balance and Lifetime earned stats. Recent history (ledger entries with label, date, badge, +/- points). “Redeem” section with options (e.g. $10 off, $25 off).
- **Redeem (insufficient balance):** Select redemption that costs more than balance. “Redeem” disabled or shows error on click.
- **Redeem (sufficient balance):** Select option, click Redeem. Button shows “Processing…”. Success: “Redemption recorded…” message; balance decreases; new ledger entry (Redeemed, negative points). Page refresh shows updated balance.
- **Redemption error:** If backend returns error (e.g. invalid option), error message displays; balance unchanged.
- **How rewards work:** “About points” / explanation copy visible. Disclaimer if present.

### 9. Notifications

- **Account notifications:** Open `/account`. “Notifications” section with preferences form (email reminders, recap, etc.). Toggle options and save. No crash; preferences persist on reload.
- **Admin notification test (admin only):** As admin, go to `/admin/notifications`. Send test reminder/recap. Check “Last 24 hours” summary and “Recent sends” log. No crash; no exposed secrets.

### 10. Affiliate

- **Non-affiliate:** As user without affiliate/admin role, open `/affiliate` directly. Expect redirect to `/dashboard`.
- **Affiliate page (affiliate/admin):** Open `/affiliate`. Overview stats (Clicks, Conversions, Commission, Payout status). “Referral link & coupon” section: copy referral link, coupon code if any. Recent referred orders (if any). Empty stats message when no data.
- **Account affiliate blurb:** In `/account`, as affiliate/admin, “Affiliate” section shows status and “Open affiliate dashboard →” to `/affiliate`.

### 11. Community

- **Community page:** Open `/community`. Rules & disclaimer visible. Room selector (if multiple rooms). Messages list with author display names. “Post message” form: submit message; it appears in list (or error shown). Report button on messages (if present): opens report flow without crash.
- **No rooms:** If no rooms (e.g. seed data missing), “No rooms available. Contact support.” or similar; no crash.
- **Refresh:** “Refresh” or reload: messages reload. No duplicate posts from double-submit.

### 12. Admin / integrations / mappings / backfill

- **Admin access:** As non-admin, open `/admin`. Expect redirect to `/dashboard`. As admin, `/admin` loads; “Launch & QA”, “Tools”, “Announcements” sections and links visible.
- **Admin QA:** `/admin/qa` — checklist/links load. “Back to admin” works.
- **Integrations:** `/admin/integrations`. Status for WooCommerce, ShipStation, Square (Configured / Callable). Recent ShipStation sync result. Links to Sync, Mappings, Backfill, Product sync, Notifications. No secrets in UI.
- **Mappings:** `/admin/mappings`. Order linkage diagnostics. Look up by user ID / WooCommerce customer ID / email. Create or update mapping (manual). Unmatched orders section: list and review. No crash on submit.
- **Backfill:** `/admin/backfill`. “Run backfill” button. Description of matching rules (email match, user_id null for unmatched). Run (or dry run if available). Result message; no crash. Idempotent: run again, no duplicate chaos.
- **Product sync:** `/admin/product-sync`. “Run product sync”. Execute; success/error message. Catalog reflects synced products.
- **Sync & status:** `/admin/sync`. ShipStation sync button; Square lookup by ID. Run sync; see result. Square lookup returns normalized status.
- **Admin affiliates:** `/admin/affiliates`. List affiliates; create/edit affiliate. Edit page saves and returns to list.
- **Admin moderation:** `/admin/moderation`. Reported messages/reports list. Actions (dismiss, etc.) work without crash.

### 13. Mobile responsiveness

- **Viewport:** Test at 320px, 375px, 414px width (portrait). No horizontal scroll; main content readable. Sidebar hidden; bottom nav (Home, Training, Stack, Orders, Account) visible and tappable. Main content has padding; CTAs and links not cut off.
- **Dashboard:** Today block, sections, and lower band stack/wrap; no overflow. Section links and CTAs tap-friendly.
- **Training / Stack / Orders:** Grids (e.g. stats, supplies) collapse to 1–2 columns; tables or lists scroll or wrap. Forms usable (inputs, buttons).
- **Catalog / Cart:** Product cards stack. Cart item list and checkout form single column; “Proceed to checkout” and “Back to cart” visible.
- **Modals/dialogs:** If any (e.g. add workout, add supply), open on mobile; close button and backdrop work; content not clipped.

### 14. Error / empty / loading states

- **Dashboard error:** Force or simulate error in dashboard route. Error boundary shows “Something went wrong”, “Try again” and “Back to dashboard”. Try again and Back to dashboard work.
- **Loading:** Navigate to `/dashboard`, `/orders`, `/stack` (or other routes with loading.tsx). Brief skeleton/loading state (if implemented); then content. No permanent spinner or blank.
- **Empty states:** Dashboard (no attention items, no favorites, no orders, no workouts, no supplies). Catalog (no products). Cart (empty). Orders (no orders). Rewards (no history). Community (no messages). All show clear copy and CTAs where appropriate; no raw “0” or broken layout.
- **404:** Open `/catalog/invalid-uuid`. Not-found page. Open `/orders/shipment/bad-id/add-to-stack` → redirect to orders.
- **Checkout success without order_id:** Open `/checkout/success`. Expect redirect to `/orders`.

---

## 2. CRITICAL TESTS

Must pass before launch. Run these first.

| # | Area | Test |
|---|------|------|
| 1 | Auth | Log out → open `/` → redirect to `/login`. Log in → redirect to `/onboarding` or `/dashboard` by profile. |
| 2 | Onboarding | Incomplete profile cannot reach `/dashboard`; completing full_name + display_name and submit lands on `/dashboard`. |
| 3 | Dashboard | Logged-in user with complete profile sees dashboard; all section links (Training, Stack, Orders, Rewards, Catalog, etc.) work. |
| 4 | Cart → Checkout | Add item to cart → `/cart` → Proceed to checkout → fill billing (and shipping if needed) → submit → redirect to `/checkout/success` with order_id; cart empty. |
| 5 | Checkout guard | Empty cart → `/checkout` redirects to `/cart`. Logged-out user on `/checkout` or `/cart` redirects to `/login`. |
| 6 | Orders | Orders page loads; order cards show status and shipments; delivered shipment shows “Add to stack” or “Inventory updated”. |
| 7 | Add to stack from shipment | From delivered shipment, “Add to stack” → add-to-stack page → add or update supply → redirect to `/stack?inventoryUpdated=1`. |
| 8 | Rewards redemption | Sufficient balance → redeem one option → success message; balance and ledger update. Insufficient balance → redeem disabled or error. |
| 9 | Role access | Non-admin `/admin` → redirect to dashboard. Non-affiliate `/affiliate` → redirect to dashboard. |
| 10 | Mobile | At 375px width: bottom nav visible; dashboard and at least Cart, Orders, Stack usable without horizontal scroll. |

---

## 3. NICE-TO-HAVE TESTS

Run after criticals if time allows.

- Forgot password: full flow to receipt of reset email.
- Progress page: charts and data correctness.
- Community: post + report + moderation flow end-to-end.
- Affiliate: referral link copy and referred order visibility.
- Admin: full backfill + product sync + ShipStation sync run and verify data in app.
- Admin notifications: test email delivery and log consistency.
- Catalog empty state when products table is empty (edge case).
- Checkout with invalid/partial form: clear validation errors.
- Multiple deliveries per order: each “Add to stack” scoped to correct shipment.
- Light/dark theme: toggle and key screens readable (contrast).

---

## 4. LIKELY FAILURE POINTS

Watch for these during QA; they are common integration/flow breakages.

- **Checkout → WooCommerce:** Submit checkout succeeds in app but WooCommerce order creation fails (network, keys, validation). Result: success page shown but order missing in store or in “Your Orders” until sync. Verify sync or error handling.
- **Orders not showing:** Customer mapping missing or wrong (email mismatch). After first order, run backfill or create mapping; ensure `user_id` linked to WooCommerce customer. Unmatched orders stay with `user_id` null.
- **Shipments not updating:** ShipStation sync not run or API key/url wrong. Orders show but shipment status/tracking/delivered_at stale. Run admin ShipStation sync and re-check.
- **Add to stack (delivered):** Only delivered shipments show “Add to stack”. If `delivered_at` not set or status not “delivered”, link may be hidden. Confirm ShipStation (or source) sets delivered status.
- **Rewards redemption:** RPC or balance check fails (e.g. concurrent redeem). Error message should show; balance should not go negative.
- **Profile completeness:** Redirect loop if `isProfileComplete` is false but profile appears filled (e.g. trim/whitespace). Check `full_name` and `display_name` both non-empty after save.
- **Mobile bottom nav:** If layout or z-index is wrong, nav can be covered or unclickable. Test tap targets and safe area.
- **Admin env:** Integrations/backfill/sync fail with “Configured: No” or “Callable: No”. Verify env vars (WOOCOMMERCE_*, SHIPSTATION_*, SQUARE_*, etc.) in deployment.

---

## 5. GO/NO-GO TESTS BEFORE LAUNCH

All must pass to go live.

1. **Sign up → onboarding → dashboard:** New user can sign up, complete profile (full name + display name), and land on dashboard.
2. **Login → dashboard:** Existing user can log in and reach dashboard (or onboarding if profile incomplete).
3. **Cart and checkout E2E:** Add product to cart from catalog → cart shows item → checkout with valid billing (and shipping if required) → success page with order_id; cart empty; order appears under Orders (after sync if applicable).
4. **Orders visible:** At least one order (from checkout or backfill) appears on Orders page for the test user; shipment and status display.
5. **Delivered shipment → Add to stack:** One delivered shipment shows “Add to stack”; flow completes and redirects to stack with inventory-updated banner.
6. **Rewards redeem:** User with enough points can redeem one option; balance decreases and redemption appears in history.
7. **Dashboard and nav:** Dashboard loads; all sidebar/bottom nav links for the user’s role work (no 404, no redirect loop).
8. **Admin isolated:** Non-admin cannot access `/admin`; admin can open `/admin` and at least Integrations and one sync/mapping tool.
9. **Mobile:** No horizontal scroll on dashboard and cart at 375px; bottom nav visible and usable.
10. **Error recovery:** Trigger dashboard error (e.g. force error in component); error UI appears with “Try again” and “Back to dashboard”; both work.

---

*End of QA Final Test Plan. Execute tests in order: Critical → Go/No-Go; fix only clear bugs; then run Nice-to-have if time.*
