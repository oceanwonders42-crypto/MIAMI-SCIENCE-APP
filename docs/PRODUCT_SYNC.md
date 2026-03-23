# Product sync — WooCommerce → app catalog

How the in-app catalog is populated from the live WooCommerce store.

## Overview

- **Source:** WooCommerce REST API (products endpoint).
- **Target:** App tables `products` and `product_links`. Catalog and favorites read from these; no checkout in app.
- **Trigger:** Admin → Product sync → Run product sync (manual). Idempotent; safe to run repeatedly.
- **Identity:** Products are matched by `external_id` (WooCommerce product id). New id → insert; existing id → update.

## Env / config

| Variable | Required | Description |
|----------|----------|-------------|
| `WOOCOMMERCE_URL` | Yes | Store base URL (e.g. `https://mia-science.com`), no trailing slash. |
| `WOOCOMMERCE_CONSUMER_KEY` | Yes | WooCommerce API consumer key. |
| `WOOCOMMERCE_CONSUMER_SECRET` | Yes | WooCommerce API consumer secret. |

Same credentials as used for the WooCommerce backfill (customers/orders). Server-side only; do not expose in client.

## How to run the sync

1. Ensure the migration that adds `products.external_id` is applied (e.g. `00015_products_external_id.sql`).
2. Set `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET` in the app env (e.g. `.env.production.local` on the server).
3. Log in as an admin user, go to **Admin → Product sync**, and click **Run product sync**.
4. Check the results: products fetched, inserted, updated, links ensured. Resolve any reported errors (e.g. slug conflict, API failure).

No cron or automatic sync is configured; run manually after store changes or on a schedule if desired.

## Field mapping (WooCommerce → app)

| WooCommerce (raw) | App `products` | Notes |
|-------------------|----------------|--------|
| `id` | `external_id` | String; used for idempotent upsert. |
| `name` | `name` | Required. |
| `slug` | `slug` | Unique in app; normalized; conflict resolved with `-{external_id}`. |
| `permalink` or `slug` | `shop_url` | Store product URL. |
| `images[0].src` | `image_url` | First image. |
| `short_description` / `description` | `description` | Prefer short, fallback to full. |
| `sale_price` / `price` / `regular_price` | `price_cents` | Parsed to cents. |
| `categories[0].name` | `category` | First category. |

**Product links:** For each product, one link with label **Shop** and URL = `shop_url` is ensured (inserted if missing). Other links (e.g. manual refill URLs) are left unchanged.

## Required fields for best catalog quality

- **Name** — Required in WooCommerce; app falls back to `"Product"` if missing.
- **Slug** — Used for stable URLs; should be unique in the store.
- **Permalink or slug** — Needed for `shop_url` and the Shop link.
- **Price** — Optional; set `price_cents` when available for display.
- **Image** — Optional; first image in `images` array.
- **Category** — Optional; first category name.
- **Short or full description** — Optional; improves catalog detail.

Products without `shop_url` will not get a Shop link; the catalog still shows them, and refill helpers can use other links if present.

## After sync

- **Catalog** (`/catalog`): Lists all products from `products` with their links; empty state if none.
- **Favorites:** Remain compatible; they reference `product_id` (UUID). Synced products get new UUIDs on first insert; re-running sync updates by `external_id` and does not change UUIDs.
- **Refill links:** `getProductLinksMap` and related helpers use `products` and `product_links`; synced Shop links are included.
