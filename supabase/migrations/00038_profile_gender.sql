-- Profile gender for body measurement diagram (male / female silhouettes) and personalization.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_gender_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'prefer_not_to_say'));

COMMENT ON COLUMN profiles.gender IS
  'male | female | prefer_not_to_say — drives body diagram; NULL uses neutral silhouette.';
