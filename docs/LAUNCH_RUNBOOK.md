# Launch runbook — Miami Science Tracker

Operator-friendly reference for going live. For full deployment detail see **DEPLOYMENT.md** and **LIVE-DEPLOYMENT-WEBHOOKS.md**.

---

## 1. Required env vars

Set in `.env.production.local` on the server (path: `/var/www/app.mia-science.com/.env.production.local`). Use `chmod 600`. Never commit or log values.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role (webhooks, cron, sync) |
| `NEXT_PUBLIC_STORE_URL` | Yes | Store URL (e.g. https://mia-science.com) |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g. https://app.mia-science.com) |
| `STORE_SYNC_ENABLED` | Yes | `true` to accept store webhooks |
| `WOOCOMMERCE_WEBHOOK_SECRET` | Yes | Same value as WooCommerce webhook secret (HMAC-SHA256) |
| `WOOCOMMERCE_URL` | For backfill/sync/checkout | WooCommerce REST API base URL |
| `WOOCOMMERCE_CONSUMER_KEY` | For backfill/sync/checkout | WooCommerce API key |
| `WOOCOMMERCE_CONSUMER_SECRET` | For backfill/sync/checkout | WooCommerce API secret |
| `NOTIFICATION_CRON_SECRET` or `CRON_SECRET` | For cron | Secret for `/api/cron/notifications` |
| `RESEND_API_KEY` | For email | Resend API key (notifications) |
| `EMAIL_FROM` | Recommended | From address for emails |
| `SHIPSTATION_API_KEY` | Optional | ShipStation shipment sync |
| `SQUARE_ACCESS_TOKEN`, `SQUARE_ENVIRONMENT` | Optional | Square invoice/order lookup |
| `NEXT_PUBLIC_STORE_ORDERS_URL` | Optional | Store order history URL (default: `{NEXT_PUBLIC_STORE_URL}/my-account/orders`) |

---

## 2. Deployment steps (summary)

1. **Server:** Create app directory, upload or clone code, set env file.
2. **Build:** `pnpm install --frozen-lockfile` then `pnpm build`.
3. **Process:** Run with PM2 on port 3001: `PORT=3001 pm2 start pnpm --name "tracker" -- start`; `pm2 save`; `pm2 startup`.
4. **Nginx:** Configure vhost for `app.mia-science.com` → proxy to 127.0.0.1:3001; enable site; `nginx -t`; reload.
5. **SSL:** After DNS points to server, run Certbot for `app.mia-science.com`.
6. **Webhooks:** Configure in WooCommerce (see §3).
7. **Cron:** Schedule notifications job (see §4).

Full commands: **DEPLOYMENT.md** and **LIVE-DEPLOYMENT-WEBHOOKS.md**.

---

## 3. Webhook setup

In WooCommerce (store): **Settings → Advanced → Webhooks**.

- **Order webhook:** Topic “Order updated” (or “Order created”); Delivery URL `https://app.mia-science.com/api/webhooks/store/order`; Secret = same as `WOOCOMMERCE_WEBHOOK_SECRET`.
- **Shipment webhook** (if used): Delivery URL `https://app.mia-science.com/api/webhooks/store/shipment`; same secret pattern.

App verifies signature (HMAC-SHA256 of raw body). If signature fails, app returns 401.

---

## 4. Cron setup

For scheduled notifications (reminders, recap): call `POST /api/cron/notifications` or `GET /api/cron/notifications?secret=<NOTIFICATION_CRON_SECRET>` on a schedule (e.g. daily). Use cron or an external scheduler; auth via `Authorization: Bearer <secret>` or `?secret=<secret>`.

See **NOTIFICATION_JOB.md** for behavior and env.

---

## 5. First production tests

After deploy and webhooks:

1. **App reachable:** Open https://app.mia-science.com; login/signup works.
2. **Integrations:** Admin → Integrations; WooCommerce (and optionally ShipStation, Square) show Configured/Callable.
3. **Webhook:** Create or update an order on the store; confirm app receives it (order appears in app for linked user, or in Admin → Mappings as unmatched).
4. **Checkout:** Add product to cart in app, complete checkout; order appears in WooCommerce and in app Orders.
5. **Notifications:** Admin → Notification test; send a test; confirm cron URL returns 200 when called with secret.

---

## 6. Rollback and checklist

**Rollback:** Redeploy previous build (e.g. `git checkout <previous-commit>`, `pnpm build`, `pm2 restart tracker`). Keep env file unchanged unless intentionally changing config.

**Pre-launch checklist:** See **LAUNCH_CHECKLIST.md**.

**If webhooks fail:** Check `WOOCOMMERCE_WEBHOOK_SECRET` matches WooCommerce; check app logs (`pm2 logs tracker`); confirm `STORE_SYNC_ENABLED=true`.

**If cron fails:** Check `NOTIFICATION_CRON_SECRET` or `CRON_SECRET`; confirm URL is reachable from scheduler; check Resend and env if emails don’t send.
