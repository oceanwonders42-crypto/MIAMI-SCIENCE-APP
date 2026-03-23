-- Allow users to insert their own reward_points_ledger rows (for redemption).
-- Run after 00008

CREATE POLICY "Users can insert own reward_points_ledger" ON reward_points_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);
