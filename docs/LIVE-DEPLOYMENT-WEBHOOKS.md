# Live deployment & webhook activation — app.mia-science.com

**Target:** Miami Science Tracker on DigitalOcean Droplet.  
**Store:** https://mia-science.com (WordPress/WooCommerce, separate).  
**App:** Next.js at https://app.mia-science.com, port 3001, path `/var/www/app.mia-science.com`.  
**Stack:** Nginx + PM2 + Certbot (SSL).  
**No app code changes — deployment and configuration only. Use env variable names only; do not expose secret values.**

---

## 1. DEPLOYMENT STATUS

| Item | Status |
|------|--------|
| App code | Ready: webhook routes, signature verification, store sync, cron route implemented |
| Deployment docs | Present: DEPLOYMENT.md, GO-LIVE-DEPLOYMENT-PLAN.md; this doc consolidates and extends |
| Webhook routes | Implemented: `POST /api/webhooks/store/order`, `POST /api/webhooks/store/shipment` (header `X-WC-Webhook-Signature`, HMAC-SHA256 of raw body, secret from env) |
| Cron route | Implemented: `POST` or `GET /api/cron/notifications` (auth: Bearer or `?secret=`) |
| Env usage | All required vars documented below; no hardcoded secrets |

**Pre-go-live:** DNS, server directory, env file, install/build, PM2, Nginx, SSL, and WooCommerce webhook configuration must be completed. Until then, the app is not reachable at https://app.mia-science.com and no store webhooks are active.

---

## 2. REQUIRED SERVER FILES / CONFIG

**Single env file (required):**

- Path: `/var/www/app.mia-science.com/.env.production.local`
- Permissions: `chmod 600` (read/write owner only)

**Env variable names (set values on server; never commit or log values):**

| Variable | Required for | Description |
|----------|--------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | App + webhooks + cron | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhooks + cron | Service role key (server-only) |
| `NEXT_PUBLIC_STORE_URL` | App | `https://mia-science.com` |
| `NEXT_PUBLIC_APP_URL` | App + notifications | `https://app.mia-science.com` |
| `STORE_SYNC_ENABLED` | Webhooks | `true` to accept store webhooks |
| `WOOCOMMERCE_WEBHOOK_SECRET` | Webhooks | Same value as WooCommerce webhook secret (HMAC-SHA256 signer) |
| `NOTIFICATION_CRON_SECRET` or `CRON_SECRET` | Cron route | Optional; required to call `/api/cron/notifications` |
| `RESEND_API_KEY` | Notifications | Optional; for email delivery |
| `EMAIL_FROM` | Notifications | Optional; from address for emails |

**Server paths:**

- App root: `/var/www/app.mia-science.com`
- Nginx vhost: `/etc/nginx/sites-available/app.mia-science.com` (symlink in `sites-enabled`)

**No other server config files required** beyond Nginx and Certbot (below).

---

## 3. EXACT DEPLOYMENT COMMANDS

Run on the Droplet (SSH as user with sudo). Replace placeholders like `your@email.com` and deploy user as needed.

**3.1 — App directory**

```bash
sudo mkdir -p /var/www/app.mia-science.com
sudo chown "$USER:$USER" /var/www/app.mia-science.com
```

**3.2 — Deploy app code**

From your **local machine** (repo root):

```bash
rsync -avz --exclude node_modules --exclude .next --exclude .git . root@129.212.182.180:/var/www/app.mia-science.com/
```

Or on the **server** (if using Git):

```bash
cd /var/www/app.mia-science.com
git clone <YOUR_TRACKER_REPO_URL> .
git checkout main
```

**3.3 — Env file**

On the server:

```bash
nano /var/www/app.mia-science.com/.env.production.local
```

Add (replace placeholder values; use only the variable names listed in §2):

```env
NEXT_PUBLIC_SUPABASE_URL=<value>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<value>
SUPABASE_SERVICE_ROLE_KEY=<value>
NEXT_PUBLIC_STORE_URL=https://mia-science.com
NEXT_PUBLIC_APP_URL=https://app.mia-science.com
STORE_SYNC_ENABLED=true
WOOCOMMERCE_WEBHOOK_SECRET=<value>
```

Optional (notifications): `NOTIFICATION_CRON_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.  
Save, then:

```bash
chmod 600 /var/www/app.mia-science.com/.env.production.local
```

**3.4 — Install and build**

On the server:

```bash
cd /var/www/app.mia-science.com
```

If Node 20 LTS is not installed:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Then:

```bash
sudo npm install -g pnpm
pnpm install --frozen-lockfile
pnpm build
```

**3.5 — PM2**

On the server:

```bash
sudo npm install -g pm2
cd /var/www/app.mia-science.com
PORT=3001 pm2 start pnpm --name "tracker" -- start
pm2 save
sudo pm2 startup
```

Follow the prompt so PM2 runs on boot. Check:

```bash
pm2 status
pm2 logs tracker --lines 20
```

App must listen on `http://127.0.0.1:3001`.

---

## 4. NGINX CONFIG

On the server:

```bash
sudo tee /etc/nginx/sites-available/app.mia-science.com << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name app.mia-science.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
EOF
```

Enable and test:

```bash
sudo ln -sf /etc/nginx/sites-available/app.mia-science.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. SSL SETUP

Run **after** DNS for `app.mia-science.com` points to the Droplet (A record `app` → `129.212.182.180`).

On the server:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.mia-science.com --non-interactive --agree-tos -m your@email.com
```

Use a real email for `-m`. Reload Nginx if needed:

```bash
sudo systemctl reload nginx
```

---

## 6. WOO WEBHOOK ACTIVATION

In **WooCommerce** (mia-science.com): **Settings → Advanced → Webhooks**.

**6.1 — Order webhook**

- **Name:** e.g. `Tracker order`
- **Status:** Active
- **Topic:** Order updated (or Order created if you only want new orders)
- **Delivery URL:** `https://app.mia-science.com/api/webhooks/store/order`
- **Secret:** Set to the **exact same value** as `WOOCOMMERCE_WEBHOOK_SECRET` in `.env.production.local`. WooCommerce signs the raw body with HMAC-SHA256 and sends it in the `X-WC-Webhook-Signature` header (base64).
- Save.

**6.2 — Shipment webhook**

- **Name:** e.g. `Tracker shipment`
- **Status:** Active
- **Topic:** Use the topic your store/shipping plugin sends (e.g. Order updated with tracking, or custom topic if available)
- **Delivery URL:** `https://app.mia-science.com/api/webhooks/store/shipment`
- **Secret:** Same value as `WOOCOMMERCE_WEBHOOK_SECRET`
- Save.

**6.3 — Check**

- Confirm both webhooks use the same secret and that it matches `WOOCOMMERCE_WEBHOOK_SECRET` on the server. Mismatch causes 401 and no processing.

---

## 7. VERIFICATION STEPS

**7.1 — Local server check (on Droplet)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/
```

Expect `200` or `307`.

**7.2 — Public route check (from any machine)**

```bash
curl -sI https://app.mia-science.com/
```

Expect `200` or `307` and HTTPS.

**7.3 — Webhook endpoints (no signature)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://app.mia-science.com/api/webhooks/store/order -X POST -H "Content-Type: application/json" -d '{}'
curl -s -o /dev/null -w "%{http_code}\n" https://app.mia-science.com/api/webhooks/store/shipment -X POST -H "Content-Type: application/json" -d '{}'
```

Expect `503` (store sync not configured) or `401` (invalid signature). Not connection refused or 5xx from app.

**7.4 — Signed test webhook request (order)**

Use the same secret as `WOOCOMMERCE_WEBHOOK_SECRET`. Replace `YOUR_WEBHOOK_SECRET` in the command with the actual value when running locally; do not commit or log it.

```bash
BODY='{"id":999,"number":"MS-TEST-999","status":"processing","total":"99.00","currency":"USD","billing":{},"meta_data":[{"key":"tracker_user_id","value":"<VALID_SUPABASE_USER_UUID>"}]}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "YOUR_WEBHOOK_SECRET" -binary | base64)
curl -s -X POST https://app.mia-science.com/api/webhooks/store/order \
  -H "Content-Type: application/json" \
  -H "X-WC-Webhook-Signature: $SIG" \
  -d "$BODY"
```

Expect HTTP 200 and JSON like `{"ok":true,"orderId":"..."}`. Confirm in Supabase `orders` table and in the app Orders page for that user.

**7.5 — Cron route (optional)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://app.mia-science.com/api/cron/notifications -X POST
```

Expect `401` (no auth) or `503` (cron secret not set). With valid `Authorization: Bearer <NOTIFICATION_CRON_SECRET>` or `?secret=<CRON_SECRET>` expect `200` and JSON with `ok` and `summary`.

---

## 8. GO-LIVE CHECKLIST

Complete in order. Do not expose secret values in logs or commits.

- [ ] **DNS** — A record `app` → `129.212.182.180` for mia-science.com. Wait for propagation (`dig app.mia-science.com` or browser).
- [ ] **Server dir** — `sudo mkdir -p /var/www/app.mia-science.com` and `sudo chown $USER:$USER /var/www/app.mia-science.com`.
- [ ] **App code** — Deploy to `/var/www/app.mia-science.com` (rsync or git clone).
- [ ] **Env file** — Create `.env.production.local` with all required vars (§2); `chmod 600 .env.production.local`.
- [ ] **Install & build** — `pnpm install --frozen-lockfile`, `pnpm build`.
- [ ] **PM2** — `PORT=3001 pm2 start pnpm --name "tracker" -- start`, `pm2 save`, `sudo pm2 startup`. Confirm `pm2 status` and local curl to 127.0.0.1:3001.
- [ ] **Nginx** — Add vhost (§4), symlink to `sites-enabled`, `nginx -t`, `systemctl reload nginx`.
- [ ] **SSL** — `certbot --nginx -d app.mia-science.com` with agree-tos and email; reload nginx.
- [ ] **Verify app** — Public curl to https://app.mia-science.com/ returns 200/307. Webhook POST without signature returns 503 or 401.
- [ ] **Order webhook** — In WooCommerce: add webhook, URL `https://app.mia-science.com/api/webhooks/store/order`, secret = `WOOCOMMERCE_WEBHOOK_SECRET` value, topic Order updated (or created), Active.
- [ ] **Shipment webhook** — Add webhook, URL `https://app.mia-science.com/api/webhooks/store/shipment`, same secret, appropriate topic, Active.
- [ ] **Signed test** — Run §7.4; confirm 200, order in Supabase and in app Orders for the test user.

When all are checked, the app is live and store webhooks are active. For notification cron, set `NOTIFICATION_CRON_SECRET` or `CRON_SECRET` and call `/api/cron/notifications` as in docs/NOTIFICATION_JOB.md.
