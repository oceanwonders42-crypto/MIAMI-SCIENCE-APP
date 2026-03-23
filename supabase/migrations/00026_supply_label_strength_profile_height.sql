-- Supply: label strength (vial/bottle label, for tracking only; no dosing logic).
-- Profile: optional height for BMI display only (informational, not used for recommendations).

ALTER TABLE supplies
  ADD COLUMN IF NOT EXISTS label_strength TEXT;

COMMENT ON COLUMN supplies.label_strength IS 'Label strength as on vial/bottle (e.g. 10mg). Tracking only; not used for dosing.';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);

COMMENT ON COLUMN profiles.height_cm IS 'Optional height in cm for BMI display only. Not used for any recommendation.';
