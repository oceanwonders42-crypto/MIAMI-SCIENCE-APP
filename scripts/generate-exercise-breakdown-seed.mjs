#!/usr/bin/env node
/**
 * Generates supabase/migrations/00040_seed_exercise_breakdown.sql from structured data.
 * Run: node scripts/generate-exercise-breakdown-seed.mjs
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rows = [
  {
    slug: "bench-press",
    difficulty: "intermediate",
    equipment: ["Barbell", "Flat bench", "Rack or spotter"],
    primary: ["Pectorals", "Anterior deltoids", "Triceps"],
    secondary: ["Serratus anterior", "Lats (stabilizers)"],
    steps: [
      "Lie on the bench with eyes under the bar, feet flat on the floor, and a slight arch in the upper back.",
      "Grip the bar slightly wider than shoulder width and unrack with straight arms over your shoulders.",
      "Lower the bar with control to mid-chest, keeping elbows at roughly a 45° angle to your torso.",
      "Touch lightly or hover at the chest, then drive the bar back up along the same path.",
      "Lock out at the top without shrugging your shoulders into your ears.",
    ],
    tips: [
      "Keep shoulder blades pinched together and down on the bench.",
      "Brace your core and maintain wrist stacked over elbows.",
      "Do not bounce the bar off your chest.",
    ],
    mistakes: [
      "Flaring elbows straight out to the sides (shoulder strain).",
      "Lifting hips off the bench to cheat the press.",
    ],
  },
  {
    slug: "incline-bench-press",
    difficulty: "intermediate",
    equipment: ["Barbell or dumbbells", "Incline bench", "Rack"],
    primary: ["Upper chest (clavicular pecs)", "Anterior deltoids"],
    secondary: ["Triceps", "Serratus anterior"],
    steps: [
      "Set the bench to roughly 30–45° and sit with feet planted firmly.",
      "Retract your shoulder blades and grip the bar or dumbbells over upper chest height.",
      "Unrack and stabilize the weight over your shoulders.",
      "Lower toward the upper chest / collarbone line with elbows slightly tucked.",
      "Press up and slightly back, finishing over shoulders without losing scapular position.",
    ],
    tips: [
      "Keep wrists neutral and elbows under the bar at the bottom.",
      "Avoid excessive arch that turns this into a flat bench.",
      "Control the eccentric; do not dive-bomb the weight.",
    ],
    mistakes: [
      "Setting the incline too steep (becomes mostly shoulders).",
      "Letting elbows flare to 90° at the bottom.",
    ],
  },
  {
    slug: "push-up",
    difficulty: "beginner",
    equipment: ["Bodyweight", "Optional mat"],
    primary: ["Chest", "Anterior deltoids", "Triceps"],
    secondary: ["Core", "Serratus anterior"],
    steps: [
      "Place hands slightly wider than shoulders, fingers forward, body in a straight line from head to heels.",
      "Brace your core and squeeze glutes so hips do not sag or pike.",
      "Lower your chest toward the floor, keeping elbows at about a 45° angle.",
      "Descend until chest is near the floor or as far as form allows.",
      "Push the floor away and return to the start without locking elbows aggressively.",
    ],
    tips: [
      "Think “long neck” — keep head in line with spine.",
      "Spread the floor slightly with your hands for shoulder stability.",
      "Breathe in on the way down, exhale as you press.",
    ],
    mistakes: [
      "Sagging hips or worming the torso.",
      "Flaring elbows straight out like a T.",
    ],
  },
  {
    slug: "cable-fly",
    difficulty: "beginner",
    equipment: ["Cable station", "D-handles"],
    primary: ["Pectorals"],
    secondary: ["Anterior deltoids", "Biceps (short head, as stabilizers)"],
    steps: [
      "Set pulleys at shoulder height (or slightly high for upper chest bias).",
      "Step forward into a split stance, slight bend in elbows, palms facing each other.",
      "Open arms wide in a controlled arc until you feel a chest stretch.",
      "Bring handles together in front of the sternum with the same slight elbow bend.",
      "Pause briefly, then reverse slowly without letting shoulders roll forward.",
    ],
    tips: [
      "Maintain a fixed elbow angle — the movement is from the shoulder.",
      "Keep ribs down; do not hyperextend the low back.",
      "Use a weight you can control through the full arc.",
    ],
    mistakes: [
      "Turning the fly into a press by bending and straightening elbows.",
      "Going too heavy and shrugging the traps.",
    ],
  },
  {
    slug: "barbell-row",
    difficulty: "intermediate",
    equipment: ["Barbell", "Plates"],
    primary: ["Lats", "Rhomboids", "Middle traps"],
    secondary: ["Biceps", "Posterior deltoids", "Erector spinae"],
    steps: [
      "Hinge at the hips with a flat back until your torso is near parallel to the floor.",
      "Grip the bar slightly wider than knees, arms hanging straight.",
      "Brace your core and row the bar toward your lower ribs / belly button.",
      "Squeeze shoulder blades together at the top without shrugging.",
      "Lower with control and reset your hinge if needed between reps.",
    ],
    tips: [
      "Keep neck neutral — look at a spot on the floor a few feet ahead.",
      "Drive elbows back, not just up.",
      "Stop the row if you lose a flat back.",
    ],
    mistakes: [
      "Using momentum from the legs and torso to heave the bar.",
      "Rounding the upper back excessively.",
    ],
  },
  {
    slug: "pull-up",
    difficulty: "intermediate",
    equipment: ["Pull-up bar"],
    primary: ["Lats", "Biceps"],
    secondary: ["Rhomboids", "Lower traps", "Core"],
    steps: [
      "Hang from the bar with full grip, shoulders slightly engaged (not fully relaxed).",
      "Depress and retract scapulae to start the pull.",
      "Pull your chest toward the bar, driving elbows down and back.",
      "Clear the bar with your chin or upper chest depending on goal.",
      "Lower slowly to full hang with control.",
    ],
    tips: [
      "Avoid excessive kipping unless training that skill specifically.",
      "Keep legs slightly in front of you to limit swing.",
      "Think “elbows to pockets” for lat engagement.",
    ],
    mistakes: [
      "Half reps — not extending arms at the bottom.",
      "Shrugging shoulders to ears at the top.",
    ],
  },
  {
    slug: "lat-pulldown",
    difficulty: "beginner",
    equipment: ["Cable machine", "Lat bar"],
    primary: ["Lats"],
    secondary: ["Biceps", "Rear deltoids", "Upper back"],
    steps: [
      "Sit with thighs secured under the pad, feet flat.",
      "Grip the bar wider than shoulders, palms facing away.",
      "Lean back slightly from the hips, chest proud.",
      "Pull the bar to upper chest while driving elbows toward your sides.",
      "Control the ascent until arms are almost straight without letting shoulders pop up.",
    ],
    tips: [
      "Initiate by pulling shoulders down, not shrugging first.",
      "Keep wrists neutral and avoid yanking with momentum.",
      "Stop if you feel pain in the front of the shoulder.",
    ],
    mistakes: [
      "Pulling behind the neck (risky for many shoulders).",
      "Using body English to swing the weight down.",
    ],
  },
  {
    slug: "deadlift",
    difficulty: "advanced",
    equipment: ["Barbell", "Plates"],
    primary: ["Hamstrings", "Glutes", "Erector spinae"],
    secondary: ["Lats", "Traps", "Forearms", "Quads"],
    steps: [
      "Stand mid-foot under the bar, feet hip-width, toes slightly out.",
      "Hinge at hips and bend knees to grip the bar just outside your legs.",
      "Pull slack out of the bar, set lats, brace your core, and keep a neutral spine.",
      "Drive through the floor, extending knees and hips together.",
      "Finish tall with hips and knees locked, then reverse the hinge to lower with control.",
    ],
    tips: [
      "Keep the bar close — it should travel in a vertical line.",
      "Do not jerk the bar off the floor; build tension first.",
      "Wear flat shoes or barefoot for stability.",
    ],
    mistakes: [
      "Rounding the low back under load.",
      "Letting the bar drift forward away from the shins.",
    ],
  },
  {
    slug: "romanian-deadlift",
    difficulty: "intermediate",
    equipment: ["Barbell or dumbbells"],
    primary: ["Hamstrings", "Glutes"],
    secondary: ["Erector spinae", "Forearms", "Adductors"],
    steps: [
      "Stand tall holding the bar at hip height with a double overhand or mixed grip.",
      "Soften knees slightly and maintain that angle through the set.",
      "Push hips back as you lower the bar along your thighs.",
      "Stop when you feel a strong hamstring stretch — usually just below the knees.",
      "Drive hips forward to return to standing, squeezing glutes at the top.",
    ],
    tips: [
      "Keep the bar grazing your legs; do not let it drift forward.",
      "Neck neutral; do not look up excessively.",
      "If you lose hamstring tension, you went too low.",
    ],
    mistakes: [
      "Squatting the weight down instead of hinging.",
      "Overarching the low back at lockout.",
    ],
  },
  {
    slug: "squat",
    difficulty: "intermediate",
    equipment: ["Barbell", "Rack", "Optional safety arms"],
    primary: ["Quads", "Glutes"],
    secondary: ["Adductors", "Erector spinae", "Core"],
    steps: [
      "Set the bar on your upper back (high or low bar per preference), hands close for shelf.",
      "Walk out, set feet shoulder-width, toes slightly out.",
      "Brace, break at hips and knees together.",
      "Descend until hip crease is at or below parallel if mobility allows.",
      "Drive up evenly through mid-foot, chest tall, knees tracking over toes.",
    ],
    tips: [
      "Spread the floor with your feet for arch stability.",
      "Keep weight over mid-foot — not on toes or heels only.",
      "Control depth before adding heavy load.",
    ],
    mistakes: [
      "Knee cave (valgus) under load.",
      "Good-morning squat — chest collapsing and hips shooting up first.",
    ],
  },
  {
    slug: "leg-press",
    difficulty: "beginner",
    equipment: ["Leg press machine"],
    primary: ["Quads", "Glutes"],
    secondary: ["Hamstrings", "Adductors"],
    steps: [
      "Sit so hips and back are supported; feet hip- to shoulder-width on the platform.",
      "Release safeties and straighten legs without locking knees aggressively.",
      "Lower the sled until knees reach roughly 90° or slightly deeper without butt lifting.",
      "Press through mid-foot and heel, not only toes.",
      "Re-rack carefully without slamming the weight.",
    ],
    tips: [
      "Keep lower back glued to the pad; reduce range if it peels off.",
      "Do not let knees collapse inward.",
      "Use a full foot contact for even pressure.",
    ],
    mistakes: [
      "Placing feet too low on the pad (excess knee stress).",
      "Locking out with a snap every rep.",
    ],
  },
  {
    slug: "lunge",
    difficulty: "beginner",
    equipment: ["Bodyweight", "Optional dumbbells"],
    primary: ["Quads", "Glutes"],
    secondary: ["Hamstrings", "Calves", "Core"],
    steps: [
      "Stand tall, step forward far enough that both knees can bend to ~90°.",
      "Lower straight down; front knee tracks over ankle, not far past toes.",
      "Back knee hovers just above the floor.",
      "Drive through the front heel to return to standing or alternate legs.",
      "Repeat for reps, switching lead leg as programmed.",
    ],
    tips: [
      "Keep torso upright — lean slightly forward only as needed for balance.",
      "Short steps make lunges quad-dominant; longer steps hit glutes more.",
      "Control the descent; do not crash the back knee down.",
    ],
    mistakes: [
      "Tiny steps that jam the front knee forward.",
      "Wobbling side-to-side — narrow stance or weak brace.",
    ],
  },
  {
    slug: "leg-curl",
    difficulty: "beginner",
    equipment: ["Leg curl machine"],
    primary: ["Hamstrings"],
    secondary: ["Calves (gastroc)", "Glutes (minor)"],
    steps: [
      "Adjust the pad so it sits just above your ankles when lying or seated per machine type.",
      "Set hip position so your thighs stay flat on the bench or pad.",
      "Curl heels toward glutes through a full comfortable range.",
      "Squeeze hamstrings at the top without lifting hips off the pad.",
      "Lower slowly to full extension without locking knees harshly.",
    ],
    tips: [
      "Point toes slightly toward shins to keep tension on hamstrings.",
      "Avoid rushing — emphasize the eccentric.",
      "Match machine type (lying vs seated) to comfort and goals.",
    ],
    mistakes: [
      "Using momentum and hip thrust to curl.",
      "Cutting range short at the bottom.",
    ],
  },
  {
    slug: "calf-raise",
    difficulty: "beginner",
    equipment: ["Calf raise machine", "Step", "Optional dumbbells"],
    primary: ["Calves (gastrocnemius & soleus)"],
    secondary: ["Ankle stabilizers"],
    steps: [
      "Stand balls of feet on an edge with heels able to drop below level.",
      "Rise onto toes as high as mobility allows, pause briefly.",
      "Lower heels slowly below parallel for a stretch.",
      "Repeat with controlled tempo; avoid bouncing.",
      "For seated raises, emphasize soleus with bent knees.",
    ],
    tips: [
      "Straight-leg work hits gastroc more; bent-knee hits soleus.",
      "Pause at the top — don’t rush through the contraction.",
      "Keep knees soft but not squatting the movement.",
    ],
    mistakes: [
      "Bouncing out of the bottom with zero control.",
      "Cutting the bottom range short.",
    ],
  },
  {
    slug: "overhead-press",
    difficulty: "intermediate",
    equipment: ["Barbell or dumbbells", "Optional rack"],
    primary: ["Anterior deltoids", "Triceps"],
    secondary: ["Upper chest", "Upper traps (stabilizers)", "Core"],
    steps: [
      "Start with bar or dumbbells at shoulder height, wrists stacked, elbows slightly forward.",
      "Brace your core and squeeze glutes to limit low-back arch.",
      "Press straight up, moving head slightly back then forward in the “window”.",
      "Lock out overhead with biceps by ears, ribs down.",
      "Lower under control back to shoulders.",
    ],
    tips: [
      "Do not lean back excessively — that turns it into a standing incline press.",
      "Full grip pressure and forearms vertical at the bottom.",
      "Exhale through the sticking point.",
    ],
    mistakes: [
      "Pressing the bar forward instead of up.",
      "Overarching the lumbar spine under load.",
    ],
  },
  {
    slug: "lateral-raise",
    difficulty: "beginner",
    equipment: ["Dumbbells or cable"],
    primary: ["Lateral deltoids"],
    secondary: ["Upper traps", "Serratus (stabilizers)"],
    steps: [
      "Stand tall with dumbbells at your sides, slight bend in elbows.",
      "Raise arms out to the sides to shoulder height in a wide arc.",
      "Lead with elbows, pinkies slightly up if comfortable.",
      "Pause briefly at the top without shrugging hard.",
      "Lower slowly — about twice as slow as the lift.",
    ],
    tips: [
      "Use lighter weight; this is not a power lift.",
      "Stop short of pain if you get impingement — adjust angle slightly forward.",
      "Keep ribs down; do not swing from the hips.",
    ],
    mistakes: [
      "Using momentum and body English.",
      "Going too high and shrugging into the traps.",
    ],
  },
  {
    slug: "front-raise",
    difficulty: "beginner",
    equipment: ["Dumbbells", "Barbell", "or cable"],
    primary: ["Anterior deltoids"],
    secondary: ["Upper pecs", "Serratus", "Core"],
    steps: [
      "Stand with weights in front of thighs, palms facing you or neutral.",
      "Lift weights forward to shoulder height with a slight elbow bend.",
      "Stop around parallel to the floor unless programming calls for more.",
      "Lower with control; avoid crashing the weights down.",
      "Alternate arms or lift together per program.",
    ],
    tips: [
      "Do not lean back to cheat the weight up.",
      "Keep wrists neutral and shoulders away from ears.",
      "Breathe steadily; brace lightly.",
    ],
    mistakes: [
      "Using hip drive to swing the weights.",
      "Raising above shoulder level with poor control.",
    ],
  },
  {
    slug: "face-pull",
    difficulty: "beginner",
    equipment: ["Cable", "Rope attachment"],
    primary: ["Rear deltoids", "Rotator cuff", "Mid traps"],
    secondary: ["Rhomboids", "Biceps (stabilizers)"],
    steps: [
      "Set cable at upper chest to face height; attach rope.",
      "Grip with thumbs toward you or neutral, elbows high and wide.",
      "Pull the rope toward your face, splitting the ends around your head.",
      "Externally rotate so hands end beside ears, upper arms parallel to floor.",
      "Control the return without letting shoulders roll forward.",
    ],
    tips: [
      "Think elbows higher than wrists through the pull.",
      "Light to moderate weight — quality over load.",
      "Great for posture and shoulder health.",
    ],
    mistakes: [
      "Pulling straight to the neck with low elbows (wrong line).",
      "Using traps to shrug instead of rear delts.",
    ],
  },
  {
    slug: "barbell-curl",
    difficulty: "beginner",
    equipment: ["Barbell", "Optional EZ-bar"],
    primary: ["Biceps"],
    secondary: ["Brachialis", "Forearms"],
    steps: [
      "Stand tall, bar at arms length, supinated grip shoulder-width.",
      "Keep elbows pinned at your sides or just in front of hips.",
      "Curl the bar toward shoulders without letting elbows drift forward.",
      "Squeeze biceps at the top without leaning back.",
      "Lower slowly to full extension.",
    ],
    tips: [
      "Do not turn this into a hip thrust — keep glutes and abs tight.",
      "Full extension at bottom without relaxing shoulders fully out of socket.",
      "Wrists neutral; don’t let them collapse backward.",
    ],
    mistakes: [
      "Swinging the torso to move the weight.",
      "Cutting range at the bottom.",
    ],
  },
  {
    slug: "hammer-curl",
    difficulty: "beginner",
    equipment: ["Dumbbells"],
    primary: ["Brachialis", "Biceps"],
    secondary: ["Forearms (brachioradialis)"],
    steps: [
      "Hold dumbbells at sides with neutral palms facing each other.",
      "Curl up toward shoulders keeping neutral grip throughout.",
      "Keep elbows close to the torso without flaring.",
      "Pause at the top, lower with control.",
      "Alternate or curl both arms together per program.",
    ],
    tips: [
      "Avoid letting elbows drift behind the body.",
      "Squeeze the handle — forearms work hard here.",
      "Stand tall; no rocking.",
    ],
    mistakes: [
      "Shrugging shoulders at the top of each rep.",
      "Using momentum from the hips.",
    ],
  },
  {
    slug: "tricep-pushdown",
    difficulty: "beginner",
    equipment: ["Cable", "Rope or straight bar"],
    primary: ["Triceps"],
    secondary: ["Anconeus", "Core (stability)"],
    steps: [
      "Stand facing the stack, elbows pinned at your sides, slight forward lean from ankles.",
      "Start with elbows bent at 90°.",
      "Extend elbows fully, pressing the handle down without moving upper arms.",
      "At the bottom, optionally spread rope ends for extra tricep squeeze.",
      "Return to 90° under control.",
    ],
    tips: [
      "Shoulders down — don’t let them roll forward.",
      "Keep wrists neutral; movement is pure elbow extension.",
      "Pick a weight you can control for high-quality reps.",
    ],
    mistakes: [
      "Elbows drifting forward and turning into a shoulder press.",
      "Half reps at the top.",
    ],
  },
  {
    slug: "skull-crusher",
    difficulty: "intermediate",
    equipment: ["Barbell or EZ-bar", "Bench"],
    primary: ["Triceps (long head)"],
    secondary: ["Anconeus", "Forearms"],
    steps: [
      "Lie on a bench, arms extended over shoulders holding the bar.",
      "Hinge only at the elbows to lower the bar toward forehead or just behind head.",
      "Keep upper arms roughly vertical or slightly tilted toward head.",
      "Extend elbows to return to start without flaring elbows wide.",
      "Use a spotter or safety when going heavy.",
    ],
    tips: [
      "Keep elbows in — think “elbows toward each other”.",
      "Do not let shoulders drift out of position; lock scapulae lightly.",
      "Control the eccentric — that’s where triceps grow.",
    ],
    mistakes: [
      "Letting elbows flare into a dangerous shoulder position.",
      "Lowering too far forward over the face with loose wrists.",
    ],
  },
  {
    slug: "plank",
    difficulty: "beginner",
    equipment: ["Bodyweight", "Optional mat"],
    primary: ["Rectus abdominis", "Transverse abdominis"],
    secondary: ["Obliques", "Glutes", "Shoulders"],
    steps: [
      "Place forearms on the floor, elbows under shoulders, legs extended.",
      "Lift hips so body forms a straight line head to heels.",
      "Squeeze glutes and quads, pull belly button toward spine.",
      "Hold position breathing shallowly without letting hips sag or pike.",
      "Time the hold or use sets as programmed.",
    ],
    tips: [
      "Push the floor away through forearms.",
      "Keep neck neutral — gaze slightly ahead of fingers.",
      "Widen feet slightly if you need more stability.",
    ],
    mistakes: [
      "Sagging hips (lumbar hyperextension stress).",
      "Piking hips up to cheat the line.",
    ],
  },
  {
    slug: "crunch",
    difficulty: "beginner",
    equipment: ["Bodyweight", "Optional mat"],
    primary: ["Rectus abdominis"],
    secondary: ["Obliques (if twisted)"],
    steps: [
      "Lie on your back, knees bent, feet flat, hands lightly behind head.",
      "Brace abs to lift shoulder blades off the floor — not the whole torso violently.",
      "Curl ribs toward pelvis in a small range.",
      "Pause briefly at the top contraction.",
      "Lower with control and reset without using neck pull.",
    ],
    tips: [
      "Hands support head; elbows stay wide — don’t yank the neck.",
      "Exhale as you crunch up.",
      "Small range is fine; quality beats amplitude.",
    ],
    mistakes: [
      "Pulling on the neck with the hands.",
      "Using momentum from arms and legs.",
    ],
  },
  {
    slug: "russian-twist",
    difficulty: "intermediate",
    equipment: ["Bodyweight", "Optional weight plate or dumbbell"],
    primary: ["Obliques", "Rectus abdominis"],
    secondary: ["Hip flexors (stabilizers)"],
    steps: [
      "Sit, lean back slightly, lift feet if advanced, or keep heels down for stability.",
      "Hold hands together or hold a weight at chest height.",
      "Rotate torso side to side, tapping the floor beside each hip if possible.",
      "Move slowly; follow hands with shoulders, not just arms.",
      "Maintain tall spine; avoid collapsing forward.",
    ],
    tips: [
      "If low back tires, keep feet on the floor.",
      "Breathe out on the twist toward each side.",
      "Keep the movement in the thoracic spine as much as possible.",
    ],
    mistakes: [
      "Rotating only the arms while shoulders stay square.",
      "Rounding the low back heavily under load.",
    ],
  },
  {
    slug: "hanging-leg-raise",
    difficulty: "advanced",
    equipment: ["Pull-up bar"],
    primary: ["Hip flexors", "Lower abs"],
    secondary: ["Forearms", "Lats (isometric grip)", "Obliques"],
    steps: [
      "Hang from the bar with full grip, shoulders engaged.",
      "Posteriorly tilt pelvis slightly to start from abs, not only hip flexors.",
      "Lift knees toward chest or legs straight up if strong and mobile.",
      "Control the descent without swinging.",
      "Stop before grip failure or excessive swinging.",
    ],
    tips: [
      "Think “roll pelvis up” not just lifting knees.",
      "Point toes to keep legs together.",
      "Use straps only if grip limits core work unintentionally.",
    ],
    mistakes: [
      "Huge kipping swings for reps.",
      "Hyperextending the low back at the bottom.",
    ],
  },
  {
    slug: "running",
    difficulty: "beginner",
    equipment: ["Running shoes", "Optional track or treadmill"],
    primary: ["Quads", "Hamstrings", "Calves", "Glutes"],
    secondary: ["Core", "Hip flexors"],
    steps: [
      "Warm up with 5–10 minutes easy movement or walk-jog.",
      "Start with short, easy strides; land under your body, not far ahead.",
      "Keep cadence comfortable; light quick feet over long lunging steps at first.",
      "Maintain relaxed shoulders and hands, slight forward lean from ankles.",
      "Cool down and stretch lightly as needed after.",
    ],
    tips: [
      "Increase volume gradually — no more than ~10% weekly jumps.",
      "Breathe rhythmically; nose or mouth as needed.",
      "Replace shoes periodically for joint comfort.",
    ],
    mistakes: [
      "Overstriding with heavy heel slam.",
      "Doing too much too soon (injury risk).",
    ],
  },
  {
    slug: "cycling",
    difficulty: "beginner",
    equipment: ["Bike", "Helmet (outdoors)"],
    primary: ["Quads", "Glutes", "Calves"],
    secondary: ["Hamstrings", "Hip flexors"],
    steps: [
      "Adjust seat height so leg is almost fully extended at bottom of pedal stroke.",
      "Pedal with balls of feet over the spindle for efficiency.",
      "Keep cadence steady; push and pull lightly through the full circle if clipped in.",
      "Relax upper body; elbows soft, core engaged.",
      "Cool down with easy spinning.",
    ],
    tips: [
      "Outdoor: obey traffic rules; indoor: set fan for cooling.",
      "Increase resistance before bouncing in the saddle.",
      "Stand climbs sparingly if knees bother you seated.",
    ],
    mistakes: [
      "Seat too low — knee pain in front.",
      "Gripping handlebars too tight — numb hands.",
    ],
  },
  {
    slug: "rowing-machine",
    difficulty: "intermediate",
    equipment: ["Row erg"],
    primary: ["Lats", "Rhomboids", "Hamstrings", "Glutes", "Quads"],
    secondary: ["Biceps", "Core", "Calves"],
    steps: [
      "Strap feet in snug; grab handle with relaxed shoulders.",
      "Start the drive with legs, then lean back slightly, then pull handle to lower ribs.",
      "Finish with legs extended, lean back modestly, handle at sternum.",
      "Recovery: arms forward, hinge hips, bend knees, slide forward smoothly.",
      "Repeat with a 1:2 drive-to-recovery rhythm at first.",
    ],
    tips: [
      "Straight handle path — not sky-high toward the chin.",
      "Do not shoot the slide — shoulders and seat move together on recovery.",
      "Damper setting moderate; higher is not always “harder better”.",
    ],
    mistakes: [
      "Pulling early with arms before legs finish driving.",
      "Rounding the back at the catch.",
    ],
  },
  {
    slug: "jump-rope",
    difficulty: "beginner",
    equipment: ["Jump rope", "Optional mat"],
    primary: ["Calves", "Anterior tibialis"],
    secondary: ["Shoulders (endurance)", "Core"],
    steps: [
      "Hold handles at hip height, elbows close, rope behind you.",
      "Flick wrists to swing rope overhead, not huge arm circles.",
      "Jump just high enough to clear the rope — small hops.",
      "Land softly on the balls of feet, knees slightly bent.",
      "Build time gradually; rest before form breaks down.",
    ],
    tips: [
      "Look forward, not at feet.",
      "Keep jumps low — efficiency beats height.",
      "Short rope is easier to turn; size rope to your height.",
    ],
    mistakes: [
      "Donkey kicks backward — jumping too high.",
      "Excessive arm circles instead of wrist rotation.",
    ],
  },
  {
    slug: "hip-mobility",
    difficulty: "beginner",
    equipment: ["Mat", "Optional band"],
    primary: ["Hip flexors", "Glutes", "Hip rotators"],
    secondary: ["Adductors", "Low back (relief)"],
    steps: [
      "Start with 5–10 minutes easy movement or walking.",
      "Perform 90/90 hip switches or seated hip rotations slowly.",
      "Add gentle bodyweight squats to depth you own with control.",
      "Include hip circles or Cossack shifts if comfortable.",
      "Breathe deeply; no sharp pain — only mild stretch discomfort.",
    ],
    tips: [
      "Mobility is not static stretching only — move through ranges.",
      "Keep ribs stacked over pelvis during drills.",
      "Daily short sessions beat occasional long grinds.",
    ],
    mistakes: [
      "Forcing painful end ranges.",
      "Holding breath and bracing against mobility work.",
    ],
  },
  {
    slug: "shoulder-mobility",
    difficulty: "beginner",
    equipment: ["Band", "Stick or PVC", "Wall"],
    primary: ["Rotator cuff", "Shoulder capsule"],
    secondary: ["Upper back", "Thoracic spine"],
    steps: [
      "Stand tall; perform arm circles in a small-to-medium range.",
      "Use a stick for shoulder dislocates with very wide grip at first.",
      "Band pull-aparts at chest height with external rotation emphasis.",
      "Wall slides or serratus punches for overhead patterning.",
      "Keep ribs down; stop before pinching pain in the front of shoulder.",
    ],
    tips: [
      "Frequency beats intensity for mobility.",
      "Pair with face pulls for balance if you bench often.",
      "Warm tissues slightly before deep end-range work.",
    ],
    mistakes: [
      "Using heavy loads during mobility drills.",
      "Shrugging traps into ears on every rep.",
    ],
  },
  {
    slug: "cat-cow",
    difficulty: "beginner",
    equipment: ["Mat"],
    primary: ["Spinal erectors (mobility)", "Abdominals (control)"],
    secondary: ["Rhomboids", "Shoulder girdle stability"],
    steps: [
      "Start on hands and knees with wrists under shoulders, knees under hips.",
      "Inhale, drop belly, lift tailbone and chest slightly — cow.",
      "Exhale, round spine tuck chin and tailbone — cat.",
      "Move slowly segment by segment if possible.",
      "Repeat for smooth breath-linked reps without rushing.",
    ],
    tips: [
      "Keep elbows soft but not hyperextended.",
      "Let the neck follow the spine naturally.",
      "Great morning warm-up or between long sitting bouts.",
    ],
    mistakes: [
      "Moving only the neck or only the low back.",
      "Forcing end ranges with speed.",
    ],
  },
];

function escSqlStr(s) {
  return s.replace(/'/g, "''");
}

function sqlTextArray(arr) {
  return `ARRAY[${arr.map((x) => `'${escSqlStr(x)}'`).join(", ")}]::text[]`;
}

let sql = `-- Seed exercise breakdowns for all library exercises (safe to re-run).
-- Updates by slug; leaves unrelated columns unchanged.

`;

for (const r of rows) {
  const steps = JSON.stringify(r.steps);
  const tips = JSON.stringify(r.tips);
  const mistakes = JSON.stringify(r.mistakes);

  sql += `UPDATE exercises SET
  steps = $sj$${steps}$sj$::jsonb,
  form_tips = $ft$${tips}$ft$::jsonb,
  common_mistakes = $cm$${mistakes}$cm$::jsonb,
  primary_muscles = ${sqlTextArray(r.primary)},
  secondary_muscles = ${sqlTextArray(r.secondary)},
  difficulty = '${r.difficulty}',
  equipment = ${sqlTextArray(r.equipment)}
WHERE slug = '${r.slug}';

`;
}

const outPath = join(__dirname, "../supabase/migrations/00040_seed_exercise_breakdown.sql");
writeFileSync(outPath, sql, "utf8");
console.log("Wrote", outPath, `(${rows.length} exercises)`);
