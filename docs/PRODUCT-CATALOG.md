# Product catalog — how to populate

The app shows a read-only **Product catalog** and uses products for **refill / buy-again** links and **favorites**. No in-app checkout; users open the store in a new tab.

## Data source

- **`products`** — one row per product (name, slug, image_url, shop_url, optional description, price_cents, category).
- **`product_links`** — one or more URLs per product (e.g. “Buy”, “View on store”) with label and sort_order.

Catalog and refill logic use:

1. **product_links** (first by sort_order) for the primary “View product” / “Buy” URL.
2. **products.shop_url** as fallback when there are no product_links.
3. **Supplies**: if a supply has `product_id` set, refill uses that product’s link. If not, the app tries to match by **normalized product name** (lowercase, trimmed) so naming supplies like the product (e.g. “Creatine Monohydrate”) can still get a specific refill link when a product with that name exists.

## Populating products

1. **Insert into `products`**  
   - `name`, `slug` (unique), optionally `image_url`, `shop_url`, `description`, `price_cents`, `category`.  
   - Run migration `00010_products_favorites.sql` first so `description`, `price_cents`, `category` exist.

2. **Insert into `product_links`**  
   - `product_id` (FK to products), `label` (e.g. “View product”), `url`, `sort_order`.  
   - The first link (lowest sort_order) is used as the main “View product” / “Buy” URL.

3. **Optional: link supplies to products**  
   - Set `supplies.product_id` to the matching product UUID for accurate per-item refill links.  
   - If you don’t set it, the app will still try to match by **supply name** to **product name** (normalized) and use that product’s link when there’s an exact match.

## Empty catalog

If there are no rows in `products`, the catalog page shows an empty state and explains that products come from the `products` and `product_links` tables. Add data there (manually, via SQL, or a future admin/sync job) to show items in the catalog and improve refill CTAs.
