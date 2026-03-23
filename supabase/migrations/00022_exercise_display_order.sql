-- Featured/curated ordering for exercise library. Lower display_order = show first.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS display_order integer DEFAULT NULL;
COMMENT ON COLUMN exercises.display_order IS 'Lower = show first in library/browse; null = sort by name';
