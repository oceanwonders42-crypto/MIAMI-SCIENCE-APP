-- Phase 8B: Store webhook ingestion — allow orders without a linked user until mapping exists
-- Run after 00005

-- Orders: user_id may be null when order is synced from store before customer/tracker mapping
ALTER TABLE orders
  ALTER COLUMN user_id DROP NOT NULL;

-- RLS unchanged: "Users can read own orders" (auth.uid() = user_id) — unlinked orders (user_id IS NULL) are not visible to any user until linked.
