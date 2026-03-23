# Miami Science Tracker — Project audit

Audit date: based on current codebase. No assumptions from prior summaries; verified against routes, lib, components, migrations, and integration code.

---

## 1. PROJECT STATUS SUMMARY

The app is a mobile-first Next.js MVP with Supabase backend. Auth, onboarding, profile and account editing, workout and supply trackers (full CRUD), dashboard widgets, orders and rewards display, affiliate dashboard and admin management, community rooms with moderation, and store webhook ingestion (order + shipment) are implemented. Data flows from the app’s own DB; orders and shipments can be populated via WooCommerce webhooks once the app is deployed and webhooks are configured. Progress (body metrics, protocols) is a placeholder. Rewards have no redemption flow. There is no ShipStation or Square integration in this codebase. SliceWP is a documented boundary with stubs only. Deployment and webhook configuration are documented but deployment itself is a config/deploy step, not code.

---

## 2. FULLY COMPLETED

**Auth**
- Supabase auth: login, signup, forgot-password.
- Session handling in middleware (updateSession); protected routes and role-based access enforced in layout/pages.

**Onboarding & profile**
- Onboarding page with ProfileForm; redirect to dashboard when profile is complete (`isProfileComplete`: full_name + display_name).
- Account page: profile editing (full name, display name, fitness goal, preferred units, timezone) via shared ProfileForm and `saveOnboarding`/`updateProfile`; email and role display; affiliate summary when applicable.

**Workout tracker**
- Training page: list workouts, create (workout form), edit and delete (WorkoutRow modal + confirm).
- `getRecentWorkouts`, `getWorkoutStats`, `updateWorkout`, `deleteWorkout` in lib; dashboard widget (workouts this week, streak).

**Supply tracker**
- Stack page: list supplies, create, update count (UpdateSupplyForm), full edit and delete (SupplyRow); low-supply and days-left logic; refill CTA.
- `getSupplies`, `updateSupply`, `deleteSupply`, `isLowSupply` in lib; dashboard widget (active supplies, low supply count).

**Dashboard**
- Real data: workouts, supplies, orders (latest), shipments (active), reward balance, affiliate stats (when affiliate/admin).
- Links to Orders, Rewards, Training, Stack; shop refill link.

**Orders**
- Orders page: `getOrders` + `getShipmentsForOrder` per order; OrderCard with shipments, shop link; empty state + dev SeedDemoButton.
- Orders come from Supabase only; webhook ingestion can populate them when deployed and configured.

**Shipments**
- No dedicated /shipments route; shipments shown on dashboard (count) and on Orders page (per order).
- `getShipmentsForUser`, `getShipmentsForOrder`, status display; schema supports `external_id` for webhook upsert.

**Rewards**
- Rewards page: balance, lifetime earned, ledger with labels and types (earned/adjusted/redeemed).
- `getRewardBalance`, `getRewardLedger`, `getLifetimeEarned`; display only — no redemption flow.

**Affiliate**
- Affiliate dashboard (role-gated): profile view, referral link, coupon; stats (clicks, conversions, commission, payout); recent referred orders from `orders.referred_by_user_id`.
- `affiliateProvider.getProfileView`, `getStatsView`, `getRecentReferredOrders` (DB-backed when webhook sets referred_by_user_id).

**Admin — affiliates**
- Admin affiliates page: list all affiliate profiles (with display names), create (AffiliateForm: user_id, referral_code, coupon, link, payout_status, status, set role), edit (per-profile page).
- Server actions and RLS allow admin to read/write affiliate_profiles and update user_roles.

**Admin — moderation**
- Moderation page: list reports with status, reporter display name, room name, reason, message content; “View in context” link to community room; ReportActions (review/dismiss).
- Reports store `room_id`; `getModerationReports` joins room and reporter for display.

**Community**
- Community page: rooms by slug, room switcher, messages, display names; post message; report message (with room_id); refresh button; affiliate-only room gating.
- `getRoomsForUser`, `getMessages`, `ensureRoomMembership`, `addMessage`, report action with room_id.

**Store webhook ingestion**
- `POST /api/webhooks/store/order`: raw body, WooCommerce signature verification, `processStoreOrderWebhook` (upsert by external_id; user_id from customer-mapping).
- `POST /api/webhooks/store/shipment`: same pattern; `processStoreShipmentWebhook` (resolve order by external_id, upsert shipment by external_id or order_id+tracking_number).
- Store sync boundary: `store-config`, `store-sync` (order + shipment payload mapping, idempotent upsert); service-role client for webhooks.

**Customer mapping**
- `customer-mapping.ts`: `resolveUserIdFromPayload`; only `tracker_user_id` (or meta_data) used today; `customer_email` and `store_customer_id` documented for future use.

**Integration boundaries**
- `store-config`: getStoreBaseUrl, isStoreSyncEnabled, verifyWooCommerceWebhookSignature.
- `store-sync`: order and shipment processing; referral webhook stub.
- `affiliate-provider`: DB-backed profile, stats, referred orders.
- `slicewp.ts`: boundary and stubs only; no live API.
- `integrations/README.md`: documents store webhooks, payloads, customer mapping, SliceWP.

**Deployment documentation**
- `docs/DEPLOYMENT.md`: app.mia-science.com, PM2, Nginx, Certbot, env vars, webhook URLs, verification commands.
- `docs/WC-SQUARE-INVOICE-DROPLET-DEPLOY.md`: runbook for the separate WooCommerce/Square plugin on the Droplet (not part of this app).

**Schema (migrations)**
- 00001: profiles, user_roles, workouts, supplies, orders, shipments, rewards, affiliate_profiles, affiliate_stats_cache, chat_rooms, chat_messages, moderation_reports, notifications, etc., with RLS.
- 00002–00003: profile fields, workout fields, order/shipment/reward display fields.
- 00004: community/moderation.
- 00005: referred_by_user_id on orders, room_id on moderation_reports, admin RLS for affiliate_profiles and user_roles.
- 00006: orders.user_id nullable for webhook.
- 00007: shipments.external_id for webhook upsert.

---

## 3. PARTIALLY COMPLETED

**Progress page**
- Exists at /progress with layout and sections “Body metrics” and “Routine adherence”.
- No forms, no reads/writes: body_metrics and protocol_logs tables exist in schema but are unused in the app.

**Admin**
- Affiliates and Moderation are fully implemented.
- “Featured products” and “Reward points” and “Announcements” are placeholder cards with no backend or UI.

**Rewards**
- Balance, ledger, and lifetime earned are implemented and displayed.
- No redemption flow: no “redeem” action, no API, no admin adjust; ledger type “redeemed” is inferred from reason text only.

**SliceWP**
- Boundary and env check (`isSliceWPSyncEnabled`); stubs for profile, stats, referred orders.
- No real API calls; affiliate data is DB-only (admin-created profiles, stats cache empty until a sync exists).

**Customer mapping**
- Only `tracker_user_id` (valid UUID) resolves to user_id; orders without it stay user_id null.
- Email and store_customer_id are documented and not implemented.

**Referral attribution**
- Referred orders work when the order webhook sends `referred_by_user_id` (or meta).
- Dedicated `processStoreReferralWebhook` exists but is a stub; no separate “referral attributed” webhook route.

---

## 4. NOT YET COMPLETED

**ShipStation**
- No integration code, no webhook, no lib or env. Shipments are created only via store shipment webhook or demo seed.

**Square**
- No Square integration in this repo. WC-SQUARE doc is for the separate WooCommerce plugin on the Droplet.

**Rewards redemption**
- No UI or API to spend points; no rewards catalog or redeem action.

**Progress**
- Body metrics: table exists, no UI to log or view.
- Protocols and protocol_logs: tables exist, no UI or flows.

**Admin**
- Featured products: no CRUD or UI.
- Reward points adjustment: no UI or action.
- Announcements: no UI or storage.

**Notifications**
- Table exists; no notification creation, listing, or read state in the app.

**Dedicated shipments page**
- No /shipments route; shipments are only on dashboard and Orders page. Optional for MVP.

**Referral-only webhook**
- No route or implementation for a standalone “referral attributed” event; referral is only via order payload.

**SliceWP live sync**
- No cron or job that calls SliceWP API and upserts affiliate_profiles / affiliate_stats_cache.

**Customer mapping by email or store_customer_id**
- Not implemented; would require env flag and/or mapping table and logic in `resolveUserIdFromPayload`.

---

## 5. DEPLOYMENT / CONFIGURATION GAPS

- **App not necessarily live:** Deployment doc targets app.mia-science.com on 129.212.182.180; actual deploy (DNS, dir, build, PM2, Nginx, SSL) is a configuration step.
- **Env on server:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STORE_SYNC_ENABLED, WOOCOMMERCE_WEBHOOK_SECRET (and optional store/app URLs) must be set where the app runs.
- **WooCommerce webhooks:** Order and shipment delivery URLs must point to https://app.mia-science.com/api/webhooks/store/order and .../shipment, with the same secret as WOOCOMMERCE_WEBHOOK_SECRET. Until configured, no live orders/shipments from the store.
- **Order visibility:** Orders created by webhook without `tracker_user_id` have user_id null and do not appear on any user’s Orders page until a mapping (e.g. email or store_customer_id) is implemented or data is linked manually.
- **Affiliate stats:** affiliate_stats_cache is populated only by admin or a future SliceWP (or other) sync; no automatic stats until that integration exists.
- **Referred orders:** Show up for affiliates when orders have referred_by_user_id set (e.g. by order webhook); no referral-only webhook or SliceWP sync yet.

---

## 6. TOP 10 NEXT TASKS

1. **Deploy app to app.mia-science.com** — Follow DEPLOYMENT.md: DNS, dir, build, PM2, Nginx, SSL; set required env vars.
2. **Configure WooCommerce webhooks** — Point order and shipment webhooks to the tracker app URLs; set secret to match WOOCOMMERCE_WEBHOOK_SECRET.
3. **Verify order/shipment flow** — Place a test order (or send a signed order webhook with tracker_user_id); confirm order and optional shipment in app and on Orders page.
4. **Implement customer mapping by email (optional)** — In customer-mapping, add optional lookup by customer_email when CUSTOMER_MAPPING_BY_EMAIL_ENABLED and a single profile match; document risks.
5. **Progress: body metrics** — Add UI to log and view body_metrics (e.g. weight, date); minimal CRUD and display on /progress.
6. **Progress: protocols** — Add UI to create protocols and log protocol_logs (adherence); wire into /progress.
7. **Rewards redemption (when desired)** — Define redemption catalog or rules; add redeem action and ledger entry; optional admin adjust for reward points.
8. **SliceWP sync (if using SliceWP)** — Implement fetch/sync for affiliate profile and stats into affiliate_profiles and affiliate_stats_cache; run via cron or background job.
9. **Admin: reward points adjustment** — Page or action for admin to add/subtract points with reason; write to reward_points_ledger.
10. **Referral-only webhook (optional)** — If store sends a separate “referral attributed” event, add route and implement processStoreReferralWebhook to set orders.referred_by_user_id.

---

## 7. RECOMMENDED NEXT PHASE

**Deploy and validate store integration.** The highest-impact step is to get the app live at app.mia-science.com and WooCommerce webhooks configured so real orders (and optionally shipments) flow into the app. Until then, orders/shipments only come from demo seed or manual DB changes. After that, either add customer mapping by email so more orders attach to users, or build out Progress (body metrics + protocols) for core tracker value, then rewards redemption or SliceWP sync depending on product priority.
