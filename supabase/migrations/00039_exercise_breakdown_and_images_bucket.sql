-- Exercise how-to breakdown + difficulty/equipment. image_url continues to store URLs (AI or CDN).

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS form_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS common_mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_muscles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS difficulty TEXT,
  ADD COLUMN IF NOT EXISTS equipment TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_difficulty_check;
ALTER TABLE exercises ADD CONSTRAINT exercises_difficulty_check
  CHECK (difficulty IS NULL OR difficulty IN ('beginner', 'intermediate', 'advanced'));

COMMENT ON COLUMN exercises.steps IS 'Numbered how-to steps (JSON array of strings).';
COMMENT ON COLUMN exercises.form_tips IS 'Bullet tips for proper form (JSON array of strings).';
COMMENT ON COLUMN exercises.common_mistakes IS 'Common mistakes to avoid (JSON array of strings).';
COMMENT ON COLUMN exercises.primary_muscles IS 'Primary muscles trained.';
COMMENT ON COLUMN exercises.secondary_muscles IS 'Secondary / supporting muscles.';
COMMENT ON COLUMN exercises.difficulty IS 'beginner | intermediate | advanced';
COMMENT ON COLUMN exercises.equipment IS 'Equipment needed (text array).';

-- Public bucket for AI-generated exercise images (service role uploads; public read).
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "exercise_images_public_read" ON storage.objects;
CREATE POLICY "exercise_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'exercise-images');
