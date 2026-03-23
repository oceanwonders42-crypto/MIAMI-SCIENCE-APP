-- Per-user preference: men's or women's exercise image set in training UI.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS exercise_image_variant TEXT DEFAULT 'men'
  CHECK (exercise_image_variant IN ('men', 'women'));
COMMENT ON COLUMN profiles.exercise_image_variant IS 'Which exercise image set to show: men or women. Default men for backward compatibility.';
