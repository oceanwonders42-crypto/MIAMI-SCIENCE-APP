-- Products: external_id for WooCommerce (and other store) sync idempotency.
-- Run after 00014.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id) WHERE external_id IS NOT NULL;
