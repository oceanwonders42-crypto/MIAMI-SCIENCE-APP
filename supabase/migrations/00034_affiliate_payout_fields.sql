-- Payout preferences for affiliates (self-service).
-- payout_details: JSON, shape depends on payout_method (see app validation).

ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS payout_method TEXT,
  ADD COLUMN IF NOT EXISTS payout_details JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN affiliate_profiles.payout_method IS
  'cash_app | venmo | paypal | zelle | bank — user-selected payout channel.';
COMMENT ON COLUMN affiliate_profiles.payout_details IS
  'JSON payload for the selected method (handles, email, bank fields, etc.).';

-- Affiliates may update their own profile row (e.g. payout fields). Server actions should only write safe columns.
DROP POLICY IF EXISTS "Users can update own affiliate_profile" ON affiliate_profiles;
CREATE POLICY "Users can update own affiliate_profile"
  ON affiliate_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
