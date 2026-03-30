-- Mirror / audit timestamps for SliceWP + WooCommerce affiliate promo sync (backend truth flow).
ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS affiliate_external_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS affiliate_external_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS woo_coupon_id INTEGER;

COMMENT ON COLUMN affiliate_profiles.affiliate_external_synced_at IS
  'Last time promo/referral fields were reconciled from SliceWP (+ optional WooCommerce coupon verify).';
COMMENT ON COLUMN affiliate_profiles.affiliate_external_sync_error IS
  'Last sync failure for admin/affiliate visibility; cleared on success.';
COMMENT ON COLUMN affiliate_profiles.woo_coupon_id IS
  'WooCommerce coupon id when coupon code was verified via REST; null if not verified.';
