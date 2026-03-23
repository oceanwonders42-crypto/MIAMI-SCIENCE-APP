-- Customer mapping: link app users to WooCommerce customers for order attribution and backfill.
-- Optional orders columns for audit/matching (customer_email, woo_customer_id).
-- Run after 00011.

CREATE TABLE customer_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  woo_customer_id BIGINT NOT NULL,
  customer_email TEXT NOT NULL,
  match_source TEXT NOT NULL CHECK (match_source IN ('email', 'manual', 'woo_customer_id', 'imported')),
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(woo_customer_id)
);

CREATE INDEX idx_customer_mappings_user_id ON customer_mappings(user_id);
CREATE INDEX idx_customer_mappings_woo_customer_id ON customer_mappings(woo_customer_id);
CREATE INDEX idx_customer_mappings_customer_email ON customer_mappings(LOWER(TRIM(customer_email)));

ALTER TABLE customer_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own customer_mapping" ON customer_mappings
  FOR SELECT USING (auth.uid() = user_id);

-- Insert/update/delete only via service role (no policy = only service role can write).

-- Optional: store customer email and WooCommerce customer id on order for audit and matching.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS woo_customer_id BIGINT;
