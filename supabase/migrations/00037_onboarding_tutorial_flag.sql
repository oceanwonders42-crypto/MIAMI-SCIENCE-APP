-- First-time dashboard tutorial: persist dismissal so the modal only shows once per user.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_tutorial_completed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.onboarding_tutorial_completed IS
  'When true, the first-time dashboard tutorial has been dismissed; do not show again.';

-- Existing users (pre-feature): do not show the tutorial on next login.
UPDATE profiles SET onboarding_tutorial_completed = true;
