# Integrations boundary

The tracker app stays separate from the Miami Science store. All store links and sync go through this boundary.

## Store (mia-science.com, Droplet)

- **store-config.ts** — Store base URL (`getStoreBaseUrl()`), sync flag (`isStoreSyncEnabled()`), WooCommerce signature verification (`verifyWooCommerceWebhookSignature`). No credentials in code; env only.
- **store-sync.ts** — Webhook contract: order (`processStoreOrderWebhook`) and shipment (`processStoreShipmentWebhook`). Signature verified in route; payloads mapped and upserted by `external_id` (orders) or order link + `external_id`/tracking (shipments).

### Store order webhook (Phase 8B)

**Endpoint:** `POST /api/webhooks/store/order`

**How mia-science.com should send the webhook**

1. In WooCommerce (Droplet): **WooCommerce → Settings → Advanced → Webhooks** → Add webhook.
2. **Delivery URL:** `https://<tracker-app-host>/api/webhooks/store/order` (e.g. your Vercel or tracker app base URL).
3. **Secret:** Set the same value as `WOOCOMMERCE_WEBHOOK_SECRET` in the tracker app env. WooCommerce will sign the payload with HMAC-SHA256 and send it in the `X-WC-Webhook-Signature` header (base64).
4. **Topic:** e.g. “Order updated” or “Order created” so the tracker receives order payloads.
5. **Payload:** JSON body. Required/minimum fields used by the tracker:
   - `id` (number or string) — store order id → `external_id`
   - `number` or `order_number` (optional) — display order number
   - `status` (string)
   - `total` (number or string, e.g. `"99.00"`) — converted to cents
   - `currency` (string, default `USD`)
   - `date_created` or `created_at` (ISO string)
   - `line_items` (array) or `item_count` (number) — for item count
   - `shop_url` (optional) — else store base URL is used
   - `referred_by_user_id` (optional, UUID) — affiliate who referred the order
   - `tracker_user_id` (optional, UUID) or meta_data `tracker_user_id` — link order to tracker user when known

**Required env (tracker app)**

- `STORE_SYNC_ENABLED=true`
- `WOOCOMMERCE_WEBHOOK_SECRET=<same secret as in WooCommerce webhook>`
- `SUPABASE_SERVICE_ROLE_KEY` — for webhook route to upsert orders (bypasses RLS)

**Responses**

- `200` — `{ "ok": true, "orderId": "<uuid>" }`
- `401` — Invalid signature (wrong secret or tampered body)
- `400` — Invalid payload or processing error (message in `error`)
- `503` — Store sync not enabled

**User mapping**

- If the payload includes `tracker_user_id` (or meta_data key `tracker_user_id`) with a valid tracker user UUID, the order is linked to that user and will appear on their Orders page.
- Otherwise `user_id` is stored as null; the order exists in the DB but is not visible to any user until linked. Future options: customer_id → user_id mapping table, or email-based lookup when the store sends customer email.

**How to test the webhook from the Droplet site**

1. Ensure the tracker app has `STORE_SYNC_ENABLED=true`, `WOOCOMMERCE_WEBHOOK_SECRET=<secret>`, and `SUPABASE_SERVICE_ROLE_KEY` set.
2. From the Droplet (or any server with the same secret), send a POST to `https://<tracker-app>/api/webhooks/store/order` with:
   - Header: `Content-Type: application/json`
   - Header: `X-WC-Webhook-Signature: <base64(HMAC-SHA256(secret, rawBody))>`
   - Body: raw JSON (e.g. `{"id": 123, "number": "MS-123", "status": "processing", "total": "99.00", "currency": "USD"}`).
3. To generate the signature: `echo -n '<raw_json_body>' | openssl dgst -sha256 -hmac "<WOOCOMMERCE_WEBHOOK_SECRET>" -binary | base64`.
4. 200 + `{ "ok": true, "orderId": "..." }` means the order was upserted. Check Supabase `orders` table (and Orders page for that user if `tracker_user_id` was set).

**What remains for full sync**

- Shipment webhook is implemented (see above). A separate “shipment” or “order updated with tracking” webhook can be added later.
- **Referral attribution:** On each order webhook, `processStoreOrderWebhook` preserves an existing `referred_by_user_id`, then `attributeStoreOrderReferralIfNeeded` resolves referrer from `affiliate_profiles` (meta: `slicewp_affiliate_id`, `referral_code`, `ref`, etc., plus `coupon_lines`). Optional `processStoreReferralWebhook` updates by store `order_id` + UUID or `referral_code`. Events append to `integration_sync_log` (`store_order_referral`).
- Customer mapping: see **customer-mapping.ts** and "Customer mapping" section below.

### Store shipment webhook (Phase 8C)

**Endpoint:** `POST /api/webhooks/store/shipment`

**How to send:** Same secret and signature as order webhook. Delivery URL: `https://<tracker-app>/api/webhooks/store/shipment`. Payload: `order_id` (or `order_external_id`), `status`; optional `id` (store shipment id), `tracking_number`, `carrier`, `shipped_at`, `estimated_delivery` / `estimated_delivery_at`, `delivered_at`. Order must already exist (order webhook first). Responses: 200 `{ "ok": true, "shipmentId": "..." }`; 400 invalid/order not found; 401 invalid signature; 503 not enabled.

**Test from Droplet:** Ensure an order exists with matching `external_id`. Then POST with body e.g. `{"order_id": 123, "id": "ship-1", "tracking_number": "1Z999...", "carrier": "UPS", "status": "shipped", "shipped_at": "2025-03-17T12:00:00Z"}` and same `X-WC-Webhook-Signature` pattern.

### Customer mapping (Phase 8C prep)

**customer-mapping.ts** — Safe order-to-user resolution. Current: only `tracker_user_id` (valid UUID) links order to user. Future: `customer_email` when `CUSTOMER_MAPPING_BY_EMAIL_ENABLED` and verified lookup; `store_customer_id` when mapping table exists. Do not attach orders to the wrong user.

## Live external API clients (integration foundation)

**WooCommerce** (`woocommerce-client.ts`) — REST API v3. Env: `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`. Methods: `fetchProducts`, `fetchProductById`, `fetchOrders`, `fetchOrderById`, `fetchCustomers`. Normalizers: `normalizeWooProduct`, `normalizeWooOrder`. Webhook ingestion is unchanged and separate.

**ShipStation** (`shipstation-client.ts`) — API v2. Env: `SHIPSTATION_API_KEY`; optional `SHIPSTATION_BASE_URL` (default `https://api.shipstation.com`). Methods: `fetchShipments`, `fetchShipmentById`. Normalizer: `normalizeShipStationShipment`.

**Square** (`square-client.ts`) — Invoices and Orders APIs. Env: `SQUARE_ACCESS_TOKEN`, `SQUARE_ENVIRONMENT` (sandbox | production); optional `SQUARE_LOCATION_ID`. Methods: `fetchInvoiceById`, `fetchOrderById`. Normalizer: `normalizeSquareInvoice`.

**Diagnostics** (`integration-diagnostics.ts`) — `getWooCommerceStatus()`, `getShipStationStatus()`, `getSquareStatus()` (configured yes/no); optional `checkWooCommerceCallable()` etc. for minimal API test. No secrets in output. Admin → Integrations page shows status and env var names.

**Service layer** (`services/`) — App-friendly data from external APIs: `product-service` (WooCommerce products), `order-service` (WooCommerce orders), `shipment-service` (ShipStation shipments), `invoice-service` (Square invoice/order). Use these for future catalog sync, order sync, shipment sync; raw clients stay in `*-client.ts`.

## Affiliates

- **affiliate-provider.ts** — Affiliate data (profile, stats, referred orders). DB-only today; can be backed by SliceWP when enabled.
- **slicewp.ts** — SliceWP preparation (affiliate stats, referred orders). Enable via `SLICEWP_SYNC_ENABLED` and credentials when ready.
