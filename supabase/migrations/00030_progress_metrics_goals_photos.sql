-- Section 4: body fat on metrics, profile goals, progress photos metadata

ALTER TABLE body_metrics
  ADD COLUMN IF NOT EXISTS body_fat_percent DECIMAL(5,2);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_weight_kg DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS goal_body_fat_percent DECIMAL(5,2);

CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user_recorded
  ON progress_photos(user_id, recorded_at DESC);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own progress_photos" ON progress_photos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
