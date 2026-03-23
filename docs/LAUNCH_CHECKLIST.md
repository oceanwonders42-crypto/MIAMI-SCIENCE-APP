# Launch checklist — Miami Science Tracker

Use before public launch. Tick when done. See **LAUNCH_RUNBOOK.md** and **DEPLOYMENT.md** for detail.

---

## Deployment

- [ ] Server directory and code deployed (`/var/www/app.mia-science.com` or equivalent)
- [ ] `.env.production.local` set with all required vars; `chmod 600`
- [ ] `pnpm install --frozen-lockfile` and `pnpm build` succeed
- [ ] PM2 running on port 3001; `pm2 save` and `pm2 startup` done
- [ ] Nginx vhost configured and reloaded; SSL (Certbot) for app domain
- [ ] App reachable at https://app.mia-science.com (login/signup work)

---

## Integrations

- [ ] WooCommerce: env vars set; Admin → Integrations shows Configured + Callable
- [ ] (Optional) ShipStation: env set; run Sync & status once to confirm
- [ ] (Optional) Square: env set; Admin → Sync & status → Fetch invoice by ID works
- [ ] Product sync run at least once (Admin → Product sync) so catalog has products with `external_id`
- [ ] Backfill run if historical orders/customers needed (Admin → WooCommerce backfill)

---

## Webhooks

- [ ] WooCommerce order webhook: URL `https://app.mia-science.com/api/webhooks/store/order`, secret matches `WOOCOMMERCE_WEBHOOK_SECRET`, topic Order updated (or Order created)
- [ ] (If used) Shipment webhook: URL `https://app.mia-science.com/api/webhooks/store/shipment`, same secret
- [ ] Test: create/update order on store; confirm app receives (order in app or in Admin → Mappings)

---

## Notifications

- [ ] `NOTIFICATION_CRON_SECRET` or `CRON_SECRET` set
- [ ] Cron or scheduler calls `/api/cron/notifications` (POST with Bearer secret or GET with `?secret=`)
- [ ] `RESEND_API_KEY` and `EMAIL_FROM` set if email delivery required
- [ ] Admin → Notification test: send test; check Recent sends / logs

---

## Checkout

- [ ] Catalog has products with `external_id` (from product sync)
- [ ] Test: add to cart → checkout → place order; order created in WooCommerce and appears in app Orders
- [ ] Success page and “View your orders” / “Open store account” links work
- [ ] Payment handoff (invoice/store) clear to user

---

## QA

- [ ] **Orders:** Orders page loads; shipments show carrier/tracking where available
- [ ] **Shipments:** ShipStation sync runs; last sync visible on Integrations
- [ ] **Rewards:** Rewards page loads; balance and redemption work
- [ ] **Notifications:** Test send and cron trigger succeed
- [ ] **Affiliate:** Affiliate dashboard and admin affiliates list work
- [ ] **Mappings:** Admin → Mappings: order diagnostics, unmatched orders, manual mapping work
- [ ] **Admin QA page:** Admin → QA & launch readiness; all areas checked

---

## Final

- [ ] Runbook and checklist reviewed; env and webhook secret stored securely
- [ ] Rollback plan understood (revert build, restart PM2; env unchanged)
- [ ] Go/no-go decision recorded
