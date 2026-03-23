# Miami Science Tracker — Live deployment & WooCommerce webhook activation

**Phase:** Deploy app to app.mia-science.com and complete configuration for real order/shipment flow.  
**Source of truth:** docs/PROJECT-AUDIT.md, docs/DEPLOYMENT.md.  
**No code changes in this phase — deployment and configuration only.**

---

## 1. LIVE DEPLOYMENT STATUS

The app is **not yet live** at app.mia-science.com. All deployment and WooCommerce webhook setup are configuration steps. The codebase is ready: webhook routes, signature verification, order/shipment processing, and env-var usage are implemented. Until the steps in sections 3–5 are executed on the server and in WooCommerce, the app will not be reachable at https://app.mia-science.com and no real orders or shipments will flow from the store into the tracker.

---

## 2. WHAT IS ALREADY CODE-COMPLETE

**Webhook API**
- `POST /api/webhooks/store/order` — accepts raw body, verifies `X-WC-Webhook-Signature` (HMAC-SHA256) via `WOOCOMMERCE_WEBHOOK_SECRET`, calls `processStoreOrderWebhook`, upserts order by `external_id`, resolves `user_id` via customer-mapping (`tracker_user_id`).
- `POST /api/webhooks/store/shipment` — same pattern; `processStoreShipmentWebhook` resolves order by external_id, upserts shipment by external_id or order_id+tracking_number.

**Store sync**
- `store-config`: `isStoreSyncEnabled` (reads `STORE_SYNC_ENABLED`), `verifyWooCommerceWebhookSignature(body, signature, secret)`.
- `store-sync`: order and shipment payload mapping, idempotent upsert, service-role Supabase client for webhook handlers.

**Env usage**
- App reads: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_STORE_URL`, `NEXT_PUBLIC_APP_URL`, `STORE_SYNC_ENABLED`, `WOOCOMMERCE_WEBHOOK_SECRET`. No code changes required for these.

**Schema**
- Migrations include `orders.user_id` nullable, `shipments.external_id`, and RLS so webhook service-role can upsert orders/shipments.

**Deployment documentation**
- DEPLOYMENT.md contains full steps: DNS, directory, env file, install/build, PM2, Nginx, SSL, verification commands, webhook URLs, and required env table.

---

## 3. WHAT STILL NEEDS CONFIGURATION

**DNS**
- One A record at the DNS provider for mia-science.com: name **app**, value **129.212.182.180**, TTL e.g. 300. Must exist and propagate before SSL (Certbot) is run.

**Server (Droplet 129.212.182.180)**
- Create directory: `/var/www/app.mia-science.com`, owned by deploy user.
- Put app code in that directory (rsync from local or git clone).
- Create `.env.production.local` with real values for all required vars (see section 5).
- Install Node 18+ and pnpm if not present; run `pnpm install --frozen-lockfile` and `pnpm build`.
- Install PM2 globally; start app with `PORT=3001 pm2 start pnpm --name "tracker" -- start`; run `pm2 save` and `sudo pm2 startup`.

**Nginx**
- Create vhost file `/etc/nginx/sites-available/app.mia-science.com` (content in DEPLOYMENT.md §7): server_name app.mia-science.com, proxy_pass to 127.0.0.1:3001, standard proxy headers.
- Symlink into `sites-enabled`, run `nginx -t`, reload Nginx.

**SSL**
- After DNS for app.mia-science.com points to the Droplet: install certbot (python3-certbot-nginx), run `certbot --nginx -d app.mia-science.com` with agree-tos and email; reload Nginx if needed.

**WooCommerce**
- Create two webhooks in WooCommerce (Settings → Advanced → Webhooks) with delivery URLs and secret matching the app (see section 5). Until this is done, no live order or shipment events reach the app.

**No code, refactor, or new env names are required** — only the above configuration and deployment actions.

---

## 4. EXACT GO-LIVE CHECKLIST

Use this in order. Check off each item when done.

- [ ] **DNS** — At DNS provider for mia-science.com: A record **app** → **129.212.182.180**. Wait for propagation (e.g. 5–15 min; verify with `dig app.mia-science.com` or browser).
- [ ] **Server dir** — SSH to Droplet; `sudo mkdir -p /var/www/app.mia-science.com` and `sudo chown $USER:$USER /var/www/app.mia-science.com`.
- [ ] **App code** — Upload app to `/var/www/app.mia-science.com` (e.g. `rsync -avz --exclude node_modules --exclude .next --exclude .git . user@129.212.182.180:/var/www/app.mia-science.com/` or git clone into that path).
- [ ] **Env file** — On server, create `/var/www/app.mia-science.com/.env.production.local` with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_STORE_URL=https://mia-science.com`, `NEXT_PUBLIC_APP_URL=https://app.mia-science.com`, `STORE_SYNC_ENABLED=true`, `WOOCOMMERCE_WEBHOOK_SECRET=<your-secret>`. Run `chmod 600 .env.production.local`.
- [ ] **Install & build** — On server: `cd /var/www/app.mia-science.com`, install Node 18+ and pnpm if needed, then `pnpm install --frozen-lockfile` and `pnpm build`.
- [ ] **PM2** — On server: `cd /var/www/app.mia-science.com`, `PORT=3001 pm2 start pnpm --name "tracker" -- start`, `pm2 save`, `sudo pm2 startup` (follow prompt). Confirm `pm2 status` shows tracker running and `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/` returns 200 or 307.
- [ ] **Nginx** — On server: add vhost from DEPLOYMENT.md §7 to `/etc/nginx/sites-available/app.mia-science.com`, `sudo ln -sf /etc/nginx/sites-available/app.mia-science.com /etc/nginx/sites-enabled/`, `sudo nginx -t`, `sudo systemctl reload nginx`.
- [ ] **SSL** — On server: `sudo certbot --nginx -d app.mia-science.com --non-interactive --agree-tos -m your@email.com`. Then `sudo systemctl reload nginx` if needed.
- [ ] **Verify app** — From local machine: `curl -sI https://app.mia-science.com/` returns 200 or 307 and HTTPS. Optional: `curl -s -X POST https://app.mia-science.com/api/webhooks/store/order -H "Content-Type: application/json" -d '{}'` returns 503 (sync disabled) or 401 (invalid signature), not connection refused.

When all are checked, the app is live at https://app.mia-science.com. WooCommerce webhooks are next (section 5).

---

## 5. WOO WEBHOOK ACTIVATION CHECKLIST

Do this after the go-live checklist is complete and https://app.mia-science.com is reachable.

- [ ] **Order webhook** — In WooCommerce: Settings → Advanced → Webhooks → Add webhook. Name e.g. "Tracker order". Topic: **Order updated** (or **Order created** if you want only new orders). Delivery URL: `https://app.mia-science.com/api/webhooks/store/order`. Secret: set to the **exact same string** as `WOOCOMMERCE_WEBHOOK_SECRET` in `.env.production.local`. Status: Active. Save.
- [ ] **Shipment webhook** — Add second webhook. Name e.g. "Tracker shipment". Topic: use whatever your store/shipping plugin sends (e.g. **Order updated** with shipment data, or a custom topic if the store exposes one). Delivery URL: `https://app.mia-science.com/api/webhooks/store/shipment`. Secret: same as `WOOCOMMERCE_WEBHOOK_SECRET`. Status: Active. Save.
- [ ] **Secret match** — Confirm the secret in WooCommerce for both webhooks is byte-for-byte identical to `WOOCOMMERCE_WEBHOOK_SECRET` on the server. Mismatch causes 401 and no processing.
- [ ] **Optional: test delivery** — In WooCommerce, open one webhook and use “Send test delivery” if available; or run the signed-request test from DEPLOYMENT.md §12 (or section 6 below) to confirm 200 and order in Supabase.

**Note:** If the store does not send a dedicated “shipment” event, the shipment webhook may need to be triggered by the same “Order updated” flow that includes tracking info (payload must match what `processStoreShipmentWebhook` expects). Adjust topic or store-side integration as needed.

---

## 6. FIRST TEST TO RUN AFTER GO-LIVE

After both checklists (sections 4 and 5) are done:

1. **Signed order webhook (from server or local)**  
   Replace `YOUR_WEBHOOK_SECRET` with the actual `WOOCOMMERCE_WEBHOOK_SECRET` value.

   ```bash
   BODY='{"id":999,"number":"MS-TEST-999","status":"processing","total":"99.00","currency":"USD","billing":{},"meta_data":[{"key":"tracker_user_id","value":"<VALID_SUPABASE_USER_UUID>"}]}'
   SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "YOUR_WEBHOOK_SECRET" -binary | base64)
   curl -s -X POST https://app.mia-science.com/api/webhooks/store/order \
     -H "Content-Type: application/json" \
     -H "X-WC-Webhook-Signature: $SIG" \
     -d "$BODY"
   ```

   **Expect:** HTTP 200 and JSON like `{"ok":true,"orderId":"..."}`.

2. **Confirm in Supabase** — In Supabase dashboard, check table `orders` for a row with `external_id` = `"999"` (or the id you used) and `user_id` = the UUID you put in `tracker_user_id`.

3. **Confirm in app** — Log in as that user in the tracker app; open Orders page. The test order should appear.

If any step fails: check PM2 logs (`pm2 logs tracker`), Nginx error log, and that `STORE_SYNC_ENABLED=true` and `WOOCOMMERCE_WEBHOOK_SECRET` match. Do not commit the secret to git.

---

## 7. NEXT PHASE AFTER DEPLOYMENT

Once the app is live and the first order/shipment test passes:

- **Option A — Customer mapping:** Implement optional customer mapping by email (or store_customer_id) so orders without `tracker_user_id` in meta can still be attached to a user when there is a single matching profile; document edge cases.
- **Option B — Tracker value:** Build Progress (body metrics + protocol adherence) so the app delivers full tracker value.
- **Option C — Rewards / affiliate:** Add rewards redemption and/or admin reward-points adjustment; or implement SliceWP (or other) sync for affiliate stats.

Choose based on product priority; the audit’s “Top 10 next tasks” and “Recommended next phase” in docs/PROJECT-AUDIT.md remain the reference for ordering.
