# WooCommerce → Square invoice sync — Droplet runbook

Run every block as **root** on the Droplet in order.  
WordPress: `/var/www/html`. Plugin: `/var/www/html/wp-content/plugins/wc-square-invoice-sync`.

---

## 1. BACKUP SCRIPT

```bash
PLUGIN_DIR="/var/www/html/wp-content/plugins/wc-square-invoice-sync"
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/root/wc-square-invoice-backups-$STAMP"

echo "=== Checking plugin files ==="
test -f "$PLUGIN_DIR/includes/class-wc-square-invoice-api.php" && echo "OK: class-wc-square-invoice-api.php" || echo "MISSING: class-wc-square-invoice-api.php"
test -f "$PLUGIN_DIR/includes/class-wc-square-invoice-order-handler.php" && echo "OK: class-wc-square-invoice-order-handler.php" || echo "MISSING: class-wc-square-invoice-order-handler.php"

mkdir -p "$BACKUP_DIR"
cp -a "$PLUGIN_DIR/includes/class-wc-square-invoice-api.php" "$BACKUP_DIR/class-wc-square-invoice-api.php.bak"
cp -a "$PLUGIN_DIR/includes/class-wc-square-invoice-order-handler.php" "$BACKUP_DIR/class-wc-square-invoice-order-handler.php.bak"
echo "Backups: $BACKUP_DIR"
ls -la "$BACKUP_DIR"
```

---

## 2. REPLACE FILES STEP

Upload the two updated PHP files to these paths on the Droplet:

| Local file (plugin repo) | Droplet path |
|--------------------------|--------------|
| `includes/class-wc-square-invoice-api.php` | `/var/www/html/wp-content/plugins/wc-square-invoice-sync/includes/class-wc-square-invoice-api.php` |
| `includes/class-wc-square-invoice-order-handler.php` | `/var/www/html/wp-content/plugins/wc-square-invoice-sync/includes/class-wc-square-invoice-order-handler.php` |

From your **local** machine (plugin repo root; replace IP if needed):

```bash
scp includes/class-wc-square-invoice-api.php root@129.212.182.180:/var/www/html/wp-content/plugins/wc-square-invoice-sync/includes/
scp includes/class-wc-square-invoice-order-handler.php root@129.212.182.180:/var/www/html/wp-content/plugins/wc-square-invoice-sync/includes/
```

On the Droplet, confirm:

```bash
ls -la /var/www/html/wp-content/plugins/wc-square-invoice-sync/includes/class-wc-square-invoice-api.php
ls -la /var/www/html/wp-content/plugins/wc-square-invoice-sync/includes/class-wc-square-invoice-order-handler.php
```

---

## 3. SYNTAX CHECK

```bash
php -l /var/www/html/wp-content/plugins/wc-square-invoice-sync/includes/class-wc-square-invoice-api.php
php -l /var/www/html/wp-content/plugins/wc-square-invoice-sync/includes/class-wc-square-invoice-order-handler.php
```

Both must output: `No syntax errors detected`.

---

## 4. FIND RECENT ORDERS AND SET ORDER_ID

Run this whole block once. It lists the last 10 orders and sets `ORDER_ID` to the most recent so later sections work without editing.

```bash
cd /var/www/html

RECENT=$(wp db query "SELECT p.ID, p.post_status, MAX(CASE WHEN pm.meta_key = '_billing_email' THEN pm.meta_value END), MAX(CASE WHEN pm.meta_key = '_order_total' THEN pm.meta_value END) FROM wp_posts p LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key IN ('_billing_email','_order_total') WHERE p.post_type = 'shop_order' GROUP BY p.ID ORDER BY p.ID DESC LIMIT 10;" --skip-column-names 2>/dev/null)

if [ -z "$RECENT" ]; then
  echo "No orders from wp db query. If WP-CLI is missing, install it or run mysql manually with your wp-config.php credentials."
  echo "Example (set DB_NAME, DB_USER, DB_PASS first): mysql -u \"\$DB_USER\" -p\"\$DB_PASS\" \"\$DB_NAME\" -e \"SELECT p.ID, p.post_status FROM wp_posts p WHERE p.post_type = 'shop_order' ORDER BY p.ID DESC LIMIT 10;\""
  exit 1
fi

echo "order_id  status   billing_email   total"
echo "$RECENT"

ORDER_ID=$(echo "$RECENT" | head -1 | awk '{print $1}')
export ORDER_ID
echo ""
echo "ORDER_ID is set to: $ORDER_ID (most recent order). Use this shell for sections 5, 7, 8."
echo "To use another order: export ORDER_ID=<id>"
```

---

## 5. INSPECT ONE ORDER

Requires `ORDER_ID` set (run section 4 first, or `export ORDER_ID=<id>`).

```bash
if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" -eq 0 ] 2>/dev/null; then
  echo "ORDER_ID not set. Run section 4 first, or: export ORDER_ID=<order_id>"
  exit 1
fi

cd /var/www/html
for key in _square_customer_id _square_order_id _square_invoice_id _square_invoice_last_error _square_sync_error _square_sync_status; do
  val=$(wp post meta get "$ORDER_ID" "$key" 2>/dev/null)
  [ -z "$val" ] && val="<not set>"
  echo "$key = $val"
done
```

---

## 6. FIND LATEST LOG

```bash
LOG_DIR="/var/www/html/wp-content/uploads/wc-logs"
[ ! -d "$LOG_DIR" ] && LOG_DIR="/var/www/html/wp-content/wc-logs"

if [ ! -d "$LOG_DIR" ]; then
  echo "wc-logs dir not found. Searching..."
  find /var/www/html -type d -name "wc-logs" 2>/dev/null
  find /var/www/html -type f -name "*wc-square*" 2>/dev/null
  exit 0
fi

echo "Log directory: $LOG_DIR"
LATEST=$(ls -t "$LOG_DIR"/wc-square-invoice-sync*.log 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
  echo "Latest log: $LATEST"
  echo "=== Last 120 lines ==="
  tail -120 "$LATEST"
else
  echo "No wc-square-invoice-sync log. Recent files in $LOG_DIR:"
  ls -la "$LOG_DIR" | tail -20
fi
```

---

## 7. FORCE RETRIGGER

Requires `ORDER_ID` set (run section 4 first). Run 7a then 7b in the same shell.

**7a — Set order status to on-hold**

```bash
if [ -z "$ORDER_ID" ] || ! [[ "$ORDER_ID" =~ ^[0-9]+$ ]]; then
  echo "ORDER_ID not set or invalid. Run section 4 first."
  exit 1
fi

cd /var/www/html
wp post update "$ORDER_ID" --post_status=wc-on-hold
echo "Order $ORDER_ID set to on-hold."
```

**7b — Fire sync hook for that order**

```bash
if [ -z "$ORDER_ID" ] || ! [[ "$ORDER_ID" =~ ^[0-9]+$ ]]; then
  echo "ORDER_ID not set or invalid. Run section 4 first."
  exit 1
fi

cd /var/www/html
wp eval '
  $id = '"$ORDER_ID"';
  if ($id <= 0) { echo "ORDER_ID invalid\n"; return; }
  $order = wc_get_order($id);
  if (!$order) { echo "Order $id not found\n"; return; }
  do_action("woocommerce_order_status_on-hold", $id, $order);
  echo "Fired woocommerce_order_status_on-hold for order $id\n";
'
```

---

## 8. RECHECK ORDER

Run after section 7. Uses the same `ORDER_ID`.

```bash
if [ -z "$ORDER_ID" ] || ! [[ "$ORDER_ID" =~ ^[0-9]+$ ]]; then
  echo "ORDER_ID not set. Run section 4 first."
  exit 1
fi

cd /var/www/html
echo "=== Square meta ==="
for key in _square_customer_id _square_order_id _square_invoice_id _square_invoice_last_error _square_sync_error _square_sync_status; do
  val=$(wp post meta get "$ORDER_ID" "$key" 2>/dev/null)
  [ -z "$val" ] && val="<not set>"
  echo "$key = $val"
done

echo ""
echo "=== Order notes (last 5) ==="
wp comment list --post_id="$ORDER_ID" --number=5 --format=table 2>/dev/null || echo "Could not list notes (WP-CLI required)."
```

---

## 9. WHAT SUCCESS LOOKS LIKE

- **Meta:** `_square_invoice_id` has a non-empty value. `_square_invoice_last_error` and `_square_sync_error` are empty or `<not set>`.
- **Order notes:** A note from the plugin stating the Square invoice was created or sent.
- **Log:** Lines for this order with success wording; no error stack.

---

## 10. WHAT FAILURE LOOKS LIKE

- **Meta:** `_square_invoice_last_error` or `_square_sync_error` (or both) contain a concrete error string (e.g. from Square API), not a generic "Unknown error".
- **Order notes:** A note from the plugin with the same error text.
- **Log:** Lines for this order with that error message or stack trace.

If you still see "Unknown error" in meta or notes after a real failure, the new error-persistence code is not in use or not hit on that path.
