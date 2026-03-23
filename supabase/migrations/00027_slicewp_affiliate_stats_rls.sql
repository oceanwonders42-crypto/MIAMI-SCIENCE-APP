-- SliceWP: optional link from app affiliate to SliceWP affiliate id (set by admin).
-- Allow affiliates to upsert their own stats cache rows (SliceWP sync from server-side session).

ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS slicewp_affiliate_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_profiles_slicewp_affiliate_id
  ON affiliate_profiles (slicewp_affiliate_id)
  WHERE slicewp_affiliate_id IS NOT NULL;

COMMENT ON COLUMN affiliate_profiles.slicewp_affiliate_id IS
  'SliceWP REST API affiliate id (numeric id as string). Admin-set; speeds up API lookup.';

-- Affiliates can insert/update their own cached stats (written during SliceWP sync in-app).
CREATE POLICY "Users can insert own affiliate_stats_cache"
  ON affiliate_stats_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate_stats_cache"
  ON affiliate_stats_cache
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
