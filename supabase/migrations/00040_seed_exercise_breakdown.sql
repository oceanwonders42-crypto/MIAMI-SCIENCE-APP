-- Seed exercise breakdowns for all library exercises (safe to re-run).
-- Updates by slug; leaves unrelated columns unchanged.

UPDATE exercises SET
  steps = $sj$["Lie on the bench with eyes under the bar, feet flat on the floor, and a slight arch in the upper back.","Grip the bar slightly wider than shoulder width and unrack with straight arms over your shoulders.","Lower the bar with control to mid-chest, keeping elbows at roughly a 45° angle to your torso.","Touch lightly or hover at the chest, then drive the bar back up along the same path.","Lock out at the top without shrugging your shoulders into your ears."]$sj$::jsonb,
  form_tips = $ft$["Keep shoulder blades pinched together and down on the bench.","Brace your core and maintain wrist stacked over elbows.","Do not bounce the bar off your chest."]$ft$::jsonb,
  common_mistakes = $cm$["Flaring elbows straight out to the sides (shoulder strain).","Lifting hips off the bench to cheat the press."]$cm$::jsonb,
  primary_muscles = ARRAY['Pectorals', 'Anterior deltoids', 'Triceps']::text[],
  secondary_muscles = ARRAY['Serratus anterior', 'Lats (stabilizers)']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Barbell', 'Flat bench', 'Rack or spotter']::text[]
WHERE slug = 'bench-press';

UPDATE exercises SET
  steps = $sj$["Set the bench to roughly 30–45° and sit with feet planted firmly.","Retract your shoulder blades and grip the bar or dumbbells over upper chest height.","Unrack and stabilize the weight over your shoulders.","Lower toward the upper chest / collarbone line with elbows slightly tucked.","Press up and slightly back, finishing over shoulders without losing scapular position."]$sj$::jsonb,
  form_tips = $ft$["Keep wrists neutral and elbows under the bar at the bottom.","Avoid excessive arch that turns this into a flat bench.","Control the eccentric; do not dive-bomb the weight."]$ft$::jsonb,
  common_mistakes = $cm$["Setting the incline too steep (becomes mostly shoulders).","Letting elbows flare to 90° at the bottom."]$cm$::jsonb,
  primary_muscles = ARRAY['Upper chest (clavicular pecs)', 'Anterior deltoids']::text[],
  secondary_muscles = ARRAY['Triceps', 'Serratus anterior']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Barbell or dumbbells', 'Incline bench', 'Rack']::text[]
WHERE slug = 'incline-bench-press';

UPDATE exercises SET
  steps = $sj$["Place hands slightly wider than shoulders, fingers forward, body in a straight line from head to heels.","Brace your core and squeeze glutes so hips do not sag or pike.","Lower your chest toward the floor, keeping elbows at about a 45° angle.","Descend until chest is near the floor or as far as form allows.","Push the floor away and return to the start without locking elbows aggressively."]$sj$::jsonb,
  form_tips = $ft$["Think “long neck” — keep head in line with spine.","Spread the floor slightly with your hands for shoulder stability.","Breathe in on the way down, exhale as you press."]$ft$::jsonb,
  common_mistakes = $cm$["Sagging hips or worming the torso.","Flaring elbows straight out like a T."]$cm$::jsonb,
  primary_muscles = ARRAY['Chest', 'Anterior deltoids', 'Triceps']::text[],
  secondary_muscles = ARRAY['Core', 'Serratus anterior']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Bodyweight', 'Optional mat']::text[]
WHERE slug = 'push-up';

UPDATE exercises SET
  steps = $sj$["Set pulleys at shoulder height (or slightly high for upper chest bias).","Step forward into a split stance, slight bend in elbows, palms facing each other.","Open arms wide in a controlled arc until you feel a chest stretch.","Bring handles together in front of the sternum with the same slight elbow bend.","Pause briefly, then reverse slowly without letting shoulders roll forward."]$sj$::jsonb,
  form_tips = $ft$["Maintain a fixed elbow angle — the movement is from the shoulder.","Keep ribs down; do not hyperextend the low back.","Use a weight you can control through the full arc."]$ft$::jsonb,
  common_mistakes = $cm$["Turning the fly into a press by bending and straightening elbows.","Going too heavy and shrugging the traps."]$cm$::jsonb,
  primary_muscles = ARRAY['Pectorals']::text[],
  secondary_muscles = ARRAY['Anterior deltoids', 'Biceps (short head, as stabilizers)']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Cable station', 'D-handles']::text[]
WHERE slug = 'cable-fly';

UPDATE exercises SET
  steps = $sj$["Hinge at the hips with a flat back until your torso is near parallel to the floor.","Grip the bar slightly wider than knees, arms hanging straight.","Brace your core and row the bar toward your lower ribs / belly button.","Squeeze shoulder blades together at the top without shrugging.","Lower with control and reset your hinge if needed between reps."]$sj$::jsonb,
  form_tips = $ft$["Keep neck neutral — look at a spot on the floor a few feet ahead.","Drive elbows back, not just up.","Stop the row if you lose a flat back."]$ft$::jsonb,
  common_mistakes = $cm$["Using momentum from the legs and torso to heave the bar.","Rounding the upper back excessively."]$cm$::jsonb,
  primary_muscles = ARRAY['Lats', 'Rhomboids', 'Middle traps']::text[],
  secondary_muscles = ARRAY['Biceps', 'Posterior deltoids', 'Erector spinae']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Barbell', 'Plates']::text[]
WHERE slug = 'barbell-row';

UPDATE exercises SET
  steps = $sj$["Hang from the bar with full grip, shoulders slightly engaged (not fully relaxed).","Depress and retract scapulae to start the pull.","Pull your chest toward the bar, driving elbows down and back.","Clear the bar with your chin or upper chest depending on goal.","Lower slowly to full hang with control."]$sj$::jsonb,
  form_tips = $ft$["Avoid excessive kipping unless training that skill specifically.","Keep legs slightly in front of you to limit swing.","Think “elbows to pockets” for lat engagement."]$ft$::jsonb,
  common_mistakes = $cm$["Half reps — not extending arms at the bottom.","Shrugging shoulders to ears at the top."]$cm$::jsonb,
  primary_muscles = ARRAY['Lats', 'Biceps']::text[],
  secondary_muscles = ARRAY['Rhomboids', 'Lower traps', 'Core']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Pull-up bar']::text[]
WHERE slug = 'pull-up';

UPDATE exercises SET
  steps = $sj$["Sit with thighs secured under the pad, feet flat.","Grip the bar wider than shoulders, palms facing away.","Lean back slightly from the hips, chest proud.","Pull the bar to upper chest while driving elbows toward your sides.","Control the ascent until arms are almost straight without letting shoulders pop up."]$sj$::jsonb,
  form_tips = $ft$["Initiate by pulling shoulders down, not shrugging first.","Keep wrists neutral and avoid yanking with momentum.","Stop if you feel pain in the front of the shoulder."]$ft$::jsonb,
  common_mistakes = $cm$["Pulling behind the neck (risky for many shoulders).","Using body English to swing the weight down."]$cm$::jsonb,
  primary_muscles = ARRAY['Lats']::text[],
  secondary_muscles = ARRAY['Biceps', 'Rear deltoids', 'Upper back']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Cable machine', 'Lat bar']::text[]
WHERE slug = 'lat-pulldown';

UPDATE exercises SET
  steps = $sj$["Stand mid-foot under the bar, feet hip-width, toes slightly out.","Hinge at hips and bend knees to grip the bar just outside your legs.","Pull slack out of the bar, set lats, brace your core, and keep a neutral spine.","Drive through the floor, extending knees and hips together.","Finish tall with hips and knees locked, then reverse the hinge to lower with control."]$sj$::jsonb,
  form_tips = $ft$["Keep the bar close — it should travel in a vertical line.","Do not jerk the bar off the floor; build tension first.","Wear flat shoes or barefoot for stability."]$ft$::jsonb,
  common_mistakes = $cm$["Rounding the low back under load.","Letting the bar drift forward away from the shins."]$cm$::jsonb,
  primary_muscles = ARRAY['Hamstrings', 'Glutes', 'Erector spinae']::text[],
  secondary_muscles = ARRAY['Lats', 'Traps', 'Forearms', 'Quads']::text[],
  difficulty = 'advanced',
  equipment = ARRAY['Barbell', 'Plates']::text[]
WHERE slug = 'deadlift';

UPDATE exercises SET
  steps = $sj$["Stand tall holding the bar at hip height with a double overhand or mixed grip.","Soften knees slightly and maintain that angle through the set.","Push hips back as you lower the bar along your thighs.","Stop when you feel a strong hamstring stretch — usually just below the knees.","Drive hips forward to return to standing, squeezing glutes at the top."]$sj$::jsonb,
  form_tips = $ft$["Keep the bar grazing your legs; do not let it drift forward.","Neck neutral; do not look up excessively.","If you lose hamstring tension, you went too low."]$ft$::jsonb,
  common_mistakes = $cm$["Squatting the weight down instead of hinging.","Overarching the low back at lockout."]$cm$::jsonb,
  primary_muscles = ARRAY['Hamstrings', 'Glutes']::text[],
  secondary_muscles = ARRAY['Erector spinae', 'Forearms', 'Adductors']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Barbell or dumbbells']::text[]
WHERE slug = 'romanian-deadlift';

UPDATE exercises SET
  steps = $sj$["Set the bar on your upper back (high or low bar per preference), hands close for shelf.","Walk out, set feet shoulder-width, toes slightly out.","Brace, break at hips and knees together.","Descend until hip crease is at or below parallel if mobility allows.","Drive up evenly through mid-foot, chest tall, knees tracking over toes."]$sj$::jsonb,
  form_tips = $ft$["Spread the floor with your feet for arch stability.","Keep weight over mid-foot — not on toes or heels only.","Control depth before adding heavy load."]$ft$::jsonb,
  common_mistakes = $cm$["Knee cave (valgus) under load.","Good-morning squat — chest collapsing and hips shooting up first."]$cm$::jsonb,
  primary_muscles = ARRAY['Quads', 'Glutes']::text[],
  secondary_muscles = ARRAY['Adductors', 'Erector spinae', 'Core']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Barbell', 'Rack', 'Optional safety arms']::text[]
WHERE slug = 'squat';

UPDATE exercises SET
  steps = $sj$["Sit so hips and back are supported; feet hip- to shoulder-width on the platform.","Release safeties and straighten legs without locking knees aggressively.","Lower the sled until knees reach roughly 90° or slightly deeper without butt lifting.","Press through mid-foot and heel, not only toes.","Re-rack carefully without slamming the weight."]$sj$::jsonb,
  form_tips = $ft$["Keep lower back glued to the pad; reduce range if it peels off.","Do not let knees collapse inward.","Use a full foot contact for even pressure."]$ft$::jsonb,
  common_mistakes = $cm$["Placing feet too low on the pad (excess knee stress).","Locking out with a snap every rep."]$cm$::jsonb,
  primary_muscles = ARRAY['Quads', 'Glutes']::text[],
  secondary_muscles = ARRAY['Hamstrings', 'Adductors']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Leg press machine']::text[]
WHERE slug = 'leg-press';

UPDATE exercises SET
  steps = $sj$["Stand tall, step forward far enough that both knees can bend to ~90°.","Lower straight down; front knee tracks over ankle, not far past toes.","Back knee hovers just above the floor.","Drive through the front heel to return to standing or alternate legs.","Repeat for reps, switching lead leg as programmed."]$sj$::jsonb,
  form_tips = $ft$["Keep torso upright — lean slightly forward only as needed for balance.","Short steps make lunges quad-dominant; longer steps hit glutes more.","Control the descent; do not crash the back knee down."]$ft$::jsonb,
  common_mistakes = $cm$["Tiny steps that jam the front knee forward.","Wobbling side-to-side — narrow stance or weak brace."]$cm$::jsonb,
  primary_muscles = ARRAY['Quads', 'Glutes']::text[],
  secondary_muscles = ARRAY['Hamstrings', 'Calves', 'Core']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Bodyweight', 'Optional dumbbells']::text[]
WHERE slug = 'lunge';

UPDATE exercises SET
  steps = $sj$["Adjust the pad so it sits just above your ankles when lying or seated per machine type.","Set hip position so your thighs stay flat on the bench or pad.","Curl heels toward glutes through a full comfortable range.","Squeeze hamstrings at the top without lifting hips off the pad.","Lower slowly to full extension without locking knees harshly."]$sj$::jsonb,
  form_tips = $ft$["Point toes slightly toward shins to keep tension on hamstrings.","Avoid rushing — emphasize the eccentric.","Match machine type (lying vs seated) to comfort and goals."]$ft$::jsonb,
  common_mistakes = $cm$["Using momentum and hip thrust to curl.","Cutting range short at the bottom."]$cm$::jsonb,
  primary_muscles = ARRAY['Hamstrings']::text[],
  secondary_muscles = ARRAY['Calves (gastroc)', 'Glutes (minor)']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Leg curl machine']::text[]
WHERE slug = 'leg-curl';

UPDATE exercises SET
  steps = $sj$["Stand balls of feet on an edge with heels able to drop below level.","Rise onto toes as high as mobility allows, pause briefly.","Lower heels slowly below parallel for a stretch.","Repeat with controlled tempo; avoid bouncing.","For seated raises, emphasize soleus with bent knees."]$sj$::jsonb,
  form_tips = $ft$["Straight-leg work hits gastroc more; bent-knee hits soleus.","Pause at the top — don’t rush through the contraction.","Keep knees soft but not squatting the movement."]$ft$::jsonb,
  common_mistakes = $cm$["Bouncing out of the bottom with zero control.","Cutting the bottom range short."]$cm$::jsonb,
  primary_muscles = ARRAY['Calves (gastrocnemius & soleus)']::text[],
  secondary_muscles = ARRAY['Ankle stabilizers']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Calf raise machine', 'Step', 'Optional dumbbells']::text[]
WHERE slug = 'calf-raise';

UPDATE exercises SET
  steps = $sj$["Start with bar or dumbbells at shoulder height, wrists stacked, elbows slightly forward.","Brace your core and squeeze glutes to limit low-back arch.","Press straight up, moving head slightly back then forward in the “window”.","Lock out overhead with biceps by ears, ribs down.","Lower under control back to shoulders."]$sj$::jsonb,
  form_tips = $ft$["Do not lean back excessively — that turns it into a standing incline press.","Full grip pressure and forearms vertical at the bottom.","Exhale through the sticking point."]$ft$::jsonb,
  common_mistakes = $cm$["Pressing the bar forward instead of up.","Overarching the lumbar spine under load."]$cm$::jsonb,
  primary_muscles = ARRAY['Anterior deltoids', 'Triceps']::text[],
  secondary_muscles = ARRAY['Upper chest', 'Upper traps (stabilizers)', 'Core']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Barbell or dumbbells', 'Optional rack']::text[]
WHERE slug = 'overhead-press';

UPDATE exercises SET
  steps = $sj$["Stand tall with dumbbells at your sides, slight bend in elbows.","Raise arms out to the sides to shoulder height in a wide arc.","Lead with elbows, pinkies slightly up if comfortable.","Pause briefly at the top without shrugging hard.","Lower slowly — about twice as slow as the lift."]$sj$::jsonb,
  form_tips = $ft$["Use lighter weight; this is not a power lift.","Stop short of pain if you get impingement — adjust angle slightly forward.","Keep ribs down; do not swing from the hips."]$ft$::jsonb,
  common_mistakes = $cm$["Using momentum and body English.","Going too high and shrugging into the traps."]$cm$::jsonb,
  primary_muscles = ARRAY['Lateral deltoids']::text[],
  secondary_muscles = ARRAY['Upper traps', 'Serratus (stabilizers)']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Dumbbells or cable']::text[]
WHERE slug = 'lateral-raise';

UPDATE exercises SET
  steps = $sj$["Stand with weights in front of thighs, palms facing you or neutral.","Lift weights forward to shoulder height with a slight elbow bend.","Stop around parallel to the floor unless programming calls for more.","Lower with control; avoid crashing the weights down.","Alternate arms or lift together per program."]$sj$::jsonb,
  form_tips = $ft$["Do not lean back to cheat the weight up.","Keep wrists neutral and shoulders away from ears.","Breathe steadily; brace lightly."]$ft$::jsonb,
  common_mistakes = $cm$["Using hip drive to swing the weights.","Raising above shoulder level with poor control."]$cm$::jsonb,
  primary_muscles = ARRAY['Anterior deltoids']::text[],
  secondary_muscles = ARRAY['Upper pecs', 'Serratus', 'Core']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Dumbbells', 'Barbell', 'or cable']::text[]
WHERE slug = 'front-raise';

UPDATE exercises SET
  steps = $sj$["Set cable at upper chest to face height; attach rope.","Grip with thumbs toward you or neutral, elbows high and wide.","Pull the rope toward your face, splitting the ends around your head.","Externally rotate so hands end beside ears, upper arms parallel to floor.","Control the return without letting shoulders roll forward."]$sj$::jsonb,
  form_tips = $ft$["Think elbows higher than wrists through the pull.","Light to moderate weight — quality over load.","Great for posture and shoulder health."]$ft$::jsonb,
  common_mistakes = $cm$["Pulling straight to the neck with low elbows (wrong line).","Using traps to shrug instead of rear delts."]$cm$::jsonb,
  primary_muscles = ARRAY['Rear deltoids', 'Rotator cuff', 'Mid traps']::text[],
  secondary_muscles = ARRAY['Rhomboids', 'Biceps (stabilizers)']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Cable', 'Rope attachment']::text[]
WHERE slug = 'face-pull';

UPDATE exercises SET
  steps = $sj$["Stand tall, bar at arms length, supinated grip shoulder-width.","Keep elbows pinned at your sides or just in front of hips.","Curl the bar toward shoulders without letting elbows drift forward.","Squeeze biceps at the top without leaning back.","Lower slowly to full extension."]$sj$::jsonb,
  form_tips = $ft$["Do not turn this into a hip thrust — keep glutes and abs tight.","Full extension at bottom without relaxing shoulders fully out of socket.","Wrists neutral; don’t let them collapse backward."]$ft$::jsonb,
  common_mistakes = $cm$["Swinging the torso to move the weight.","Cutting range at the bottom."]$cm$::jsonb,
  primary_muscles = ARRAY['Biceps']::text[],
  secondary_muscles = ARRAY['Brachialis', 'Forearms']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Barbell', 'Optional EZ-bar']::text[]
WHERE slug = 'barbell-curl';

UPDATE exercises SET
  steps = $sj$["Hold dumbbells at sides with neutral palms facing each other.","Curl up toward shoulders keeping neutral grip throughout.","Keep elbows close to the torso without flaring.","Pause at the top, lower with control.","Alternate or curl both arms together per program."]$sj$::jsonb,
  form_tips = $ft$["Avoid letting elbows drift behind the body.","Squeeze the handle — forearms work hard here.","Stand tall; no rocking."]$ft$::jsonb,
  common_mistakes = $cm$["Shrugging shoulders at the top of each rep.","Using momentum from the hips."]$cm$::jsonb,
  primary_muscles = ARRAY['Brachialis', 'Biceps']::text[],
  secondary_muscles = ARRAY['Forearms (brachioradialis)']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Dumbbells']::text[]
WHERE slug = 'hammer-curl';

UPDATE exercises SET
  steps = $sj$["Stand facing the stack, elbows pinned at your sides, slight forward lean from ankles.","Start with elbows bent at 90°.","Extend elbows fully, pressing the handle down without moving upper arms.","At the bottom, optionally spread rope ends for extra tricep squeeze.","Return to 90° under control."]$sj$::jsonb,
  form_tips = $ft$["Shoulders down — don’t let them roll forward.","Keep wrists neutral; movement is pure elbow extension.","Pick a weight you can control for high-quality reps."]$ft$::jsonb,
  common_mistakes = $cm$["Elbows drifting forward and turning into a shoulder press.","Half reps at the top."]$cm$::jsonb,
  primary_muscles = ARRAY['Triceps']::text[],
  secondary_muscles = ARRAY['Anconeus', 'Core (stability)']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Cable', 'Rope or straight bar']::text[]
WHERE slug = 'tricep-pushdown';

UPDATE exercises SET
  steps = $sj$["Lie on a bench, arms extended over shoulders holding the bar.","Hinge only at the elbows to lower the bar toward forehead or just behind head.","Keep upper arms roughly vertical or slightly tilted toward head.","Extend elbows to return to start without flaring elbows wide.","Use a spotter or safety when going heavy."]$sj$::jsonb,
  form_tips = $ft$["Keep elbows in — think “elbows toward each other”.","Do not let shoulders drift out of position; lock scapulae lightly.","Control the eccentric — that’s where triceps grow."]$ft$::jsonb,
  common_mistakes = $cm$["Letting elbows flare into a dangerous shoulder position.","Lowering too far forward over the face with loose wrists."]$cm$::jsonb,
  primary_muscles = ARRAY['Triceps (long head)']::text[],
  secondary_muscles = ARRAY['Anconeus', 'Forearms']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Barbell or EZ-bar', 'Bench']::text[]
WHERE slug = 'skull-crusher';

UPDATE exercises SET
  steps = $sj$["Place forearms on the floor, elbows under shoulders, legs extended.","Lift hips so body forms a straight line head to heels.","Squeeze glutes and quads, pull belly button toward spine.","Hold position breathing shallowly without letting hips sag or pike.","Time the hold or use sets as programmed."]$sj$::jsonb,
  form_tips = $ft$["Push the floor away through forearms.","Keep neck neutral — gaze slightly ahead of fingers.","Widen feet slightly if you need more stability."]$ft$::jsonb,
  common_mistakes = $cm$["Sagging hips (lumbar hyperextension stress).","Piking hips up to cheat the line."]$cm$::jsonb,
  primary_muscles = ARRAY['Rectus abdominis', 'Transverse abdominis']::text[],
  secondary_muscles = ARRAY['Obliques', 'Glutes', 'Shoulders']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Bodyweight', 'Optional mat']::text[]
WHERE slug = 'plank';

UPDATE exercises SET
  steps = $sj$["Lie on your back, knees bent, feet flat, hands lightly behind head.","Brace abs to lift shoulder blades off the floor — not the whole torso violently.","Curl ribs toward pelvis in a small range.","Pause briefly at the top contraction.","Lower with control and reset without using neck pull."]$sj$::jsonb,
  form_tips = $ft$["Hands support head; elbows stay wide — don’t yank the neck.","Exhale as you crunch up.","Small range is fine; quality beats amplitude."]$ft$::jsonb,
  common_mistakes = $cm$["Pulling on the neck with the hands.","Using momentum from arms and legs."]$cm$::jsonb,
  primary_muscles = ARRAY['Rectus abdominis']::text[],
  secondary_muscles = ARRAY['Obliques (if twisted)']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Bodyweight', 'Optional mat']::text[]
WHERE slug = 'crunch';

UPDATE exercises SET
  steps = $sj$["Sit, lean back slightly, lift feet if advanced, or keep heels down for stability.","Hold hands together or hold a weight at chest height.","Rotate torso side to side, tapping the floor beside each hip if possible.","Move slowly; follow hands with shoulders, not just arms.","Maintain tall spine; avoid collapsing forward."]$sj$::jsonb,
  form_tips = $ft$["If low back tires, keep feet on the floor.","Breathe out on the twist toward each side.","Keep the movement in the thoracic spine as much as possible."]$ft$::jsonb,
  common_mistakes = $cm$["Rotating only the arms while shoulders stay square.","Rounding the low back heavily under load."]$cm$::jsonb,
  primary_muscles = ARRAY['Obliques', 'Rectus abdominis']::text[],
  secondary_muscles = ARRAY['Hip flexors (stabilizers)']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Bodyweight', 'Optional weight plate or dumbbell']::text[]
WHERE slug = 'russian-twist';

UPDATE exercises SET
  steps = $sj$["Hang from the bar with full grip, shoulders engaged.","Posteriorly tilt pelvis slightly to start from abs, not only hip flexors.","Lift knees toward chest or legs straight up if strong and mobile.","Control the descent without swinging.","Stop before grip failure or excessive swinging."]$sj$::jsonb,
  form_tips = $ft$["Think “roll pelvis up” not just lifting knees.","Point toes to keep legs together.","Use straps only if grip limits core work unintentionally."]$ft$::jsonb,
  common_mistakes = $cm$["Huge kipping swings for reps.","Hyperextending the low back at the bottom."]$cm$::jsonb,
  primary_muscles = ARRAY['Hip flexors', 'Lower abs']::text[],
  secondary_muscles = ARRAY['Forearms', 'Lats (isometric grip)', 'Obliques']::text[],
  difficulty = 'advanced',
  equipment = ARRAY['Pull-up bar']::text[]
WHERE slug = 'hanging-leg-raise';

UPDATE exercises SET
  steps = $sj$["Warm up with 5–10 minutes easy movement or walk-jog.","Start with short, easy strides; land under your body, not far ahead.","Keep cadence comfortable; light quick feet over long lunging steps at first.","Maintain relaxed shoulders and hands, slight forward lean from ankles.","Cool down and stretch lightly as needed after."]$sj$::jsonb,
  form_tips = $ft$["Increase volume gradually — no more than ~10% weekly jumps.","Breathe rhythmically; nose or mouth as needed.","Replace shoes periodically for joint comfort."]$ft$::jsonb,
  common_mistakes = $cm$["Overstriding with heavy heel slam.","Doing too much too soon (injury risk)."]$cm$::jsonb,
  primary_muscles = ARRAY['Quads', 'Hamstrings', 'Calves', 'Glutes']::text[],
  secondary_muscles = ARRAY['Core', 'Hip flexors']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Running shoes', 'Optional track or treadmill']::text[]
WHERE slug = 'running';

UPDATE exercises SET
  steps = $sj$["Adjust seat height so leg is almost fully extended at bottom of pedal stroke.","Pedal with balls of feet over the spindle for efficiency.","Keep cadence steady; push and pull lightly through the full circle if clipped in.","Relax upper body; elbows soft, core engaged.","Cool down with easy spinning."]$sj$::jsonb,
  form_tips = $ft$["Outdoor: obey traffic rules; indoor: set fan for cooling.","Increase resistance before bouncing in the saddle.","Stand climbs sparingly if knees bother you seated."]$ft$::jsonb,
  common_mistakes = $cm$["Seat too low — knee pain in front.","Gripping handlebars too tight — numb hands."]$cm$::jsonb,
  primary_muscles = ARRAY['Quads', 'Glutes', 'Calves']::text[],
  secondary_muscles = ARRAY['Hamstrings', 'Hip flexors']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Bike', 'Helmet (outdoors)']::text[]
WHERE slug = 'cycling';

UPDATE exercises SET
  steps = $sj$["Strap feet in snug; grab handle with relaxed shoulders.","Start the drive with legs, then lean back slightly, then pull handle to lower ribs.","Finish with legs extended, lean back modestly, handle at sternum.","Recovery: arms forward, hinge hips, bend knees, slide forward smoothly.","Repeat with a 1:2 drive-to-recovery rhythm at first."]$sj$::jsonb,
  form_tips = $ft$["Straight handle path — not sky-high toward the chin.","Do not shoot the slide — shoulders and seat move together on recovery.","Damper setting moderate; higher is not always “harder better”."]$ft$::jsonb,
  common_mistakes = $cm$["Pulling early with arms before legs finish driving.","Rounding the back at the catch."]$cm$::jsonb,
  primary_muscles = ARRAY['Lats', 'Rhomboids', 'Hamstrings', 'Glutes', 'Quads']::text[],
  secondary_muscles = ARRAY['Biceps', 'Core', 'Calves']::text[],
  difficulty = 'intermediate',
  equipment = ARRAY['Row erg']::text[]
WHERE slug = 'rowing-machine';

UPDATE exercises SET
  steps = $sj$["Hold handles at hip height, elbows close, rope behind you.","Flick wrists to swing rope overhead, not huge arm circles.","Jump just high enough to clear the rope — small hops.","Land softly on the balls of feet, knees slightly bent.","Build time gradually; rest before form breaks down."]$sj$::jsonb,
  form_tips = $ft$["Look forward, not at feet.","Keep jumps low — efficiency beats height.","Short rope is easier to turn; size rope to your height."]$ft$::jsonb,
  common_mistakes = $cm$["Donkey kicks backward — jumping too high.","Excessive arm circles instead of wrist rotation."]$cm$::jsonb,
  primary_muscles = ARRAY['Calves', 'Anterior tibialis']::text[],
  secondary_muscles = ARRAY['Shoulders (endurance)', 'Core']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Jump rope', 'Optional mat']::text[]
WHERE slug = 'jump-rope';

UPDATE exercises SET
  steps = $sj$["Start with 5–10 minutes easy movement or walking.","Perform 90/90 hip switches or seated hip rotations slowly.","Add gentle bodyweight squats to depth you own with control.","Include hip circles or Cossack shifts if comfortable.","Breathe deeply; no sharp pain — only mild stretch discomfort."]$sj$::jsonb,
  form_tips = $ft$["Mobility is not static stretching only — move through ranges.","Keep ribs stacked over pelvis during drills.","Daily short sessions beat occasional long grinds."]$ft$::jsonb,
  common_mistakes = $cm$["Forcing painful end ranges.","Holding breath and bracing against mobility work."]$cm$::jsonb,
  primary_muscles = ARRAY['Hip flexors', 'Glutes', 'Hip rotators']::text[],
  secondary_muscles = ARRAY['Adductors', 'Low back (relief)']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Mat', 'Optional band']::text[]
WHERE slug = 'hip-mobility';

UPDATE exercises SET
  steps = $sj$["Stand tall; perform arm circles in a small-to-medium range.","Use a stick for shoulder dislocates with very wide grip at first.","Band pull-aparts at chest height with external rotation emphasis.","Wall slides or serratus punches for overhead patterning.","Keep ribs down; stop before pinching pain in the front of shoulder."]$sj$::jsonb,
  form_tips = $ft$["Frequency beats intensity for mobility.","Pair with face pulls for balance if you bench often.","Warm tissues slightly before deep end-range work."]$ft$::jsonb,
  common_mistakes = $cm$["Using heavy loads during mobility drills.","Shrugging traps into ears on every rep."]$cm$::jsonb,
  primary_muscles = ARRAY['Rotator cuff', 'Shoulder capsule']::text[],
  secondary_muscles = ARRAY['Upper back', 'Thoracic spine']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Band', 'Stick or PVC', 'Wall']::text[]
WHERE slug = 'shoulder-mobility';

UPDATE exercises SET
  steps = $sj$["Start on hands and knees with wrists under shoulders, knees under hips.","Inhale, drop belly, lift tailbone and chest slightly — cow.","Exhale, round spine tuck chin and tailbone — cat.","Move slowly segment by segment if possible.","Repeat for smooth breath-linked reps without rushing."]$sj$::jsonb,
  form_tips = $ft$["Keep elbows soft but not hyperextended.","Let the neck follow the spine naturally.","Great morning warm-up or between long sitting bouts."]$ft$::jsonb,
  common_mistakes = $cm$["Moving only the neck or only the low back.","Forcing end ranges with speed."]$cm$::jsonb,
  primary_muscles = ARRAY['Spinal erectors (mobility)', 'Abdominals (control)']::text[],
  secondary_muscles = ARRAY['Rhomboids', 'Shoulder girdle stability']::text[],
  difficulty = 'beginner',
  equipment = ARRAY['Mat']::text[]
WHERE slug = 'cat-cow';

