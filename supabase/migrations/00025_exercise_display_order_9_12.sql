-- Next 4 featured exercises: display_order 9–12 (after the original 8).
-- Ensures incline-bench-press, push-up, romanian-deadlift, leg-press show next on Training home and Browse.

UPDATE exercises SET display_order = 9  WHERE slug = 'incline-bench-press';
UPDATE exercises SET display_order = 10 WHERE slug = 'push-up';
UPDATE exercises SET display_order = 11 WHERE slug = 'romanian-deadlift';
UPDATE exercises SET display_order = 12 WHERE slug = 'leg-press';
