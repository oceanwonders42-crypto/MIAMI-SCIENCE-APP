-- Meal / calorie log entries (optional photo in progress-photos bucket; path stored here)

CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_storage_path TEXT,
  calories INTEGER NOT NULL CHECK (calories >= 0 AND calories < 20000),
  protein_g INTEGER CHECK (protein_g IS NULL OR (protein_g >= 0 AND protein_g < 2000)),
  carbs_g INTEGER CHECK (carbs_g IS NULL OR (carbs_g >= 0 AND carbs_g < 5000)),
  fat_g INTEGER CHECK (fat_g IS NULL OR (fat_g >= 0 AND fat_g < 2000)),
  notes TEXT,
  estimate_source TEXT NOT NULL DEFAULT 'manual' CHECK (estimate_source IN ('manual', 'ai')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_logged
  ON public.meal_logs (user_id, logged_at DESC);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own meal_logs" ON public.meal_logs;
CREATE POLICY "Users select own meal_logs" ON public.meal_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own meal_logs" ON public.meal_logs;
CREATE POLICY "Users insert own meal_logs" ON public.meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own meal_logs" ON public.meal_logs;
CREATE POLICY "Users update own meal_logs" ON public.meal_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own meal_logs" ON public.meal_logs;
CREATE POLICY "Users delete own meal_logs" ON public.meal_logs
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.meal_logs IS 'User meal / calorie log; optional photo path under progress-photos bucket.';
