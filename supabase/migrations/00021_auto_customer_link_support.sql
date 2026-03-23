-- Support automatic WooCommerce customer linking by email.
-- 1. Allow match_source 'auto_email' in customer_mappings.
-- 2. Throttle auto-link attempts per user via profiles.

-- WooCommerce customer_mappings: add auto_email to allowed match_source.
ALTER TABLE customer_mappings
  DROP CONSTRAINT IF EXISTS customer_mappings_match_source_check;

ALTER TABLE customer_mappings
  ADD CONSTRAINT customer_mappings_match_source_check
  CHECK (match_source IN ('email', 'manual', 'woo_customer_id', 'imported', 'auto_email'));

-- Throttle: only attempt auto-link if last attempt was > 24h ago or never.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_customer_auto_link_attempt_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.last_customer_auto_link_attempt_at IS 'Last time we attempted automatic WooCommerce customer linking for this user; used to throttle API calls.';
