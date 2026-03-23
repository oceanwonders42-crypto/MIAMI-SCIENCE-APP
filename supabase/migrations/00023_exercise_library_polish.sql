-- Polish seed: descriptions and featured display_order. Safe to re-run (UPDATE only).

-- Short descriptions where missing or minimal
UPDATE exercises SET description = 'Lie on bench, lower bar to chest, press up.' WHERE slug = 'bench-press' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Incline bench, lower to upper chest, press.' WHERE slug = 'incline-bench-press' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Hands on floor, lower chest to floor, push up.' WHERE slug = 'push-up' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Cables at chest height, bring handles together in front.' WHERE slug = 'cable-fly' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Hinge at hips, pull bar to lower chest.' WHERE slug = 'barbell-row' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Hang from bar, pull until chin over bar.' WHERE slug = 'pull-up' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Pull bar to upper chest, control return.' WHERE slug = 'lat-pulldown' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Hinge at hips, drive through heels to stand with bar.' WHERE slug = 'deadlift' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Slight knee bend, hinge at hips, lower bar along legs.' WHERE slug = 'romanian-deadlift' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Squat down with bar on upper back, stand.' WHERE slug = 'squat' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Seated, press platform away with feet.' WHERE slug = 'leg-press' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Step forward, lower back knee toward floor, stand.' WHERE slug = 'lunge' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Curl heels toward glutes (machine or lying).' WHERE slug = 'leg-curl' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Rise onto toes, lower with control.' WHERE slug = 'calf-raise' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Press bar or dumbbells overhead to lockout.' WHERE slug = 'overhead-press' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Raise arms to sides to shoulder height.' WHERE slug = 'lateral-raise' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Raise weight in front to shoulder height.' WHERE slug = 'front-raise' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Pull rope to face, squeeze shoulder blades.' WHERE slug = 'face-pull' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Curl bar to shoulders, lower with control.' WHERE slug = 'barbell-curl' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Curl with neutral grip (thumbs up).' WHERE slug = 'hammer-curl' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Push cable or bar down, extend elbows.' WHERE slug = 'tricep-pushdown' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Lower bar to forehead, extend back up.' WHERE slug = 'skull-crusher' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Hold rigid body on forearms and toes.' WHERE slug = 'plank' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Curl shoulders toward hips, controlled.' WHERE slug = 'crunch' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Seated, rotate torso side to side with weight.' WHERE slug = 'russian-twist' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Hang from bar, raise legs toward bar.' WHERE slug = 'hanging-leg-raise' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Run at steady or interval pace.' WHERE slug = 'running' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Pedal on bike or stationary bike.' WHERE slug = 'cycling' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Pull handle, drive with legs and arms.' WHERE slug = 'rowing-machine' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Jump over rope, land softly.' WHERE slug = 'jump-rope' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Hip circles, leg swings, stretches.' WHERE slug = 'hip-mobility' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Arm circles, band pull-aparts, stretches.' WHERE slug = 'shoulder-mobility' AND (description IS NULL OR description = '');
UPDATE exercises SET description = 'Alternate arch and round spine on hands and knees.' WHERE slug = 'cat-cow' AND (description IS NULL OR description = '');

-- Featured order: show these first on training home and browse (lower = first)
UPDATE exercises SET display_order = 1  WHERE slug = 'bench-press';
UPDATE exercises SET display_order = 2  WHERE slug = 'squat';
UPDATE exercises SET display_order = 3  WHERE slug = 'deadlift';
UPDATE exercises SET display_order = 4  WHERE slug = 'pull-up';
UPDATE exercises SET display_order = 5  WHERE slug = 'overhead-press';
UPDATE exercises SET display_order = 6  WHERE slug = 'barbell-row';
UPDATE exercises SET display_order = 7  WHERE slug = 'plank';
UPDATE exercises SET display_order = 8  WHERE slug = 'lunge';
