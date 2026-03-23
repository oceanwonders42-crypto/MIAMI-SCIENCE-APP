-- Exercise library: optional images, category, description. Used for visual cards and detail.
-- workout_entries.exercise_name stays the source of truth; exercises table enriches display.
-- Run after 00018.

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  image_url text,
  category text,
  muscle_group text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercises_slug ON exercises (slug);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises (name);

COMMENT ON TABLE exercises IS 'Exercise library for display (images, category). workout_entries reference by name.';

-- RLS: anyone can read; only service role or admin can write (future).
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are readable by everyone"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Exercises are readable by anon for public catalog"
  ON exercises FOR SELECT
  TO anon
  USING (true);
