-- Phase 5: Orders, shipments, rewards display fields
-- Run after 00002

-- Orders: display and reorder support
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS item_count INT,
  ADD COLUMN IF NOT EXISTS shop_url TEXT;

-- Shipments: explicit shipped date
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Reward ledger: optional display description
ALTER TABLE reward_points_ledger
  ADD COLUMN IF NOT EXISTS description TEXT;
