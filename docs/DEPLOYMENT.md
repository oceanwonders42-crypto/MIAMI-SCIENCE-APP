# Miami Science Tracker — Deploy to app.mia-science.com

Droplet IP: **129.212.182.180**. App at **https://app.mia-science.com**, separate from WooCommerce codebase.

---

## 1. DEPLOYMENT MODEL

- **Model:** Next.js runs as a Node process under PM2 on port 3001; Nginx reverse-proxies `app.mia-science.com` to it. App is separate from the mia-science.com/WooCommerce site.
- **App directory:** `/var/www/app.mia-science.com`
- **App port:** `3001`
- **Nginx vhost:** `/etc/nginx/sites-available/app.mia-science.com` (symlink in `sites-enabled`).
- **DNS:** One A record: `app.mia-science.com` → `129.212.182.180`.

**Prerequisites:**

- SSH access to the Droplet (129.212.182.180) with sudo.
- Node.js 18+ (20 LTS recommended) and pnpm on the server.
- Nginx installed (already used for mia-science.com).
- Supabase project URL, anon key, and **service role key**.
- A **webhook secret** string (same value in app env and WooCommerce).

---

## 2. DNS RECORD TO CREATE

At the DNS provider for **mia-science.com**:

| Type | Name | Value           | TTL |
|------|------|-----------------|-----|
| A    | app  | 129.212.182.180 | 300 |

So `app.mia-science.com` resolves to the Droplet. Wait for propagation before SSL (step 8).

---

## 3. SERVER DIRECTORY SETUP

**On the Droplet (SSH as root or your user):**

```bash
sudo mkdir -p /var/www/app.mia-science.com
sudo chown "$USER:$USER" /var/www/app.mia-science.com
```

**Upload or clone the app into `/var/www/app.mia-science.com`.**

Option A — from your **local machine** (tracker repo root):

```bash
rsync -avz --exclude node_modules --exclude .next --exclude .git . root@129.212.182.180:/var/www/app.mia-science.com/
```

Option B — on the **server** (if you use Git):

```bash
cd /var/www/app.mia-science.com
git clone <YOUR_TRACKER_REPO_URL> .
git checkout main
```

---

## 4. ENV FILE

**On the Droplet:**

```bash
nano /var/www/app.mia-science.com/.env.production.local
```

Paste (replace placeholders with your real values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_STORE_URL=https://mia-science.com
NEXT_PUBLIC_APP_URL=https://app.mia-science.com

STORE_SYNC_ENABLED=true
WOOCOMMERCE_WEBHOOK_SECRET=your-webhook-secret
```

Save (Ctrl+O, Enter, Ctrl+X). Then:

```bash
chmod 600 /var/www/app.mia-science.com/.env.production.local
```

---

## 5. INSTALL + BUILD

**On the Droplet:**

```bash
cd /var/www/app.mia-science.com
```

If Node 18+ is not installed:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Install pnpm and project deps, then build:

```bash
sudo npm install -g pnpm
pnpm install --frozen-lockfile
pnpm build
```

---

## 6. PM2 SETUP

**On the Droplet:**

```bash
sudo npm install -g pm2
cd /var/www/app.mia-science.com
PORT=3001 pm2 start pnpm --name "tracker" -- start
pm2 save
sudo pm2 startup
```

Answer the prompt so PM2 runs on boot. Check:

```bash
pm2 status
pm2 logs tracker --lines 20
```

App must be listening on `http://127.0.0.1:3001`.

---

## 7. NGINX CONFIG

**On the Droplet:**

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

Enable and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/app.mia-science.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL SETUP

**On the Droplet** (after DNS for `app.mia-science.com` points to 129.212.182.180):

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.mia-science.com --non-interactive --agree-tos -m your@email.com
```

Use your real email for `-m`. Certbot configures HTTPS. Reload Nginx if needed:

```bash
sudo systemctl reload nginx
```

---

## 9. VERIFICATION COMMANDS

**On the Droplet:**

```bash
# Local app
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/
# Expect 200 or 307

# Order webhook (public, expect 503 or 401)
curl -s -o /dev/null -w "%{http_code}\n" https://app.mia-science.com/api/webhooks/store/order -X POST -H "Content-Type: application/json" -d '{}'

# Shipment webhook (public, expect 503 or 401)
curl -s -o /dev/null -w "%{http_code}\n" https://app.mia-science.com/api/webhooks/store/shipment -X POST -H "Content-Type: application/json" -d '{}'

# Home page HTTPS
curl -sI https://app.mia-science.com/ | head -3
```

**From your local machine:**

```bash
curl -sI https://app.mia-science.com/
curl -s -X POST https://app.mia-science.com/api/webhooks/store/order -H "Content-Type: application/json" -d '{}'
# Expect 503 (sync not enabled) or 401 (invalid signature), not connection refused
```

---

## 10. FINAL WEBHOOK URLS

Use these in WooCommerce (WooCommerce → Settings → Advanced → Webhooks).

**Order webhook — Delivery URL:**

```
https://app.mia-science.com/api/webhooks/store/order
```

**Shipment webhook — Delivery URL:**

```
https://app.mia-science.com/api/webhooks/store/shipment
```

**Secret:** In WooCommerce, set the webhook “Secret” to the **exact same value** as the env var **`WOOCOMMERCE_WEBHOOK_SECRET`** in `.env.production.local`. WooCommerce signs the body with HMAC-SHA256 and sends it in the `X-WC-Webhook-Signature` header.

---

## 11. REQUIRED ENV VARS

All in `/var/www/app.mia-science.com/.env.production.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (webhooks write to DB) |
| `NEXT_PUBLIC_STORE_URL` | Recommended | `https://mia-science.com` |
| `NEXT_PUBLIC_APP_URL` | Recommended | `https://app.mia-science.com` |
| `STORE_SYNC_ENABLED` | Yes for webhooks | `true` |
| `WOOCOMMERCE_WEBHOOK_SECRET` | Yes for webhooks | Same string as in WooCommerce webhook secret |

---

## 12. NEXT ACTIONS

1. Create DNS A record: **app** → **129.212.182.180**.
2. On Droplet: create `/var/www/app.mia-science.com`, upload or clone app (step 3).
3. Create `.env.production.local` with all vars above (step 4).
4. Run install + build (step 5).
5. Start app with PM2 on port 3001, save and enable startup (step 6).
6. Add Nginx vhost and reload Nginx (step 7).
7. Run Certbot for `app.mia-science.com` (step 8).
8. Run verification commands (step 9).
9. In WooCommerce, add **order** webhook: URL `https://app.mia-science.com/api/webhooks/store/order`, secret = `WOOCOMMERCE_WEBHOOK_SECRET` value.
10. In WooCommerce, add **shipment** webhook: URL `https://app.mia-science.com/api/webhooks/store/shipment`, same secret.
11. **Test flow:** Trigger an order (or “Order updated”) from WooCommerce, or from the server:  
    `BODY='{"id":123,"number":"MS-123","status":"processing","total":"99.00","currency":"USD"}'`  
    `SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "YOUR_WEBHOOK_SECRET" -binary | base64)`  
    `curl -s -X POST https://app.mia-science.com/api/webhooks/store/order -H "Content-Type: application/json" -H "X-WC-Webhook-Signature: $SIG" -d "$BODY"`  
    Expect **200** and `{"ok":true,"orderId":"..."}`; confirm the order in Supabase.

**PM2:**

```bash
pm2 restart tracker
pm2 logs tracker
pm2 status
```

**After code changes:**

```bash
cd /var/www/app.mia-science.com
git pull   # or rsync again
pnpm install --frozen-lockfile
pnpm build
pm2 restart tracker
```
