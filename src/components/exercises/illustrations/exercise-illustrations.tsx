/**
 * Unique minimalist line-art SVGs for each seeded exercise (side / iconic view).
 * Dark UI: stroke uses currentColor (zinc-100 on zinc-950).
 */
import type { ComponentType, ReactNode, SVGProps } from "react";
import { stroke as s } from "./svg-common";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, className, ...rest }: P & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Bench — supine on bench, bar over chest */
export function BenchPressIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="6" y1="62" x2="94" y2="62" {...s} strokeWidth={2} />
      <line x1="18" y1="62" x2="18" y2="72" {...s} />
      <line x1="82" y1="62" x2="82" y2="72" {...s} />
      <path
        d="M28 58c4-8 14-10 22-6l28 4M38 52c8-4 18-2 24 4M32 58h36M44 38h14"
        {...s}
      />
      <circle cx="50" cy="34" r="5" {...s} />
      <path d="M50 39v10M38 48l-6-2M62 48l6-2" {...s} />
    </Svg>
  );
}

/** Incline — angled bench up-right */
export function InclineBenchPressIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M8 78 L88 42" {...s} strokeWidth={2} />
      <line x1="14" y1="74" x2="14" y2="84" {...s} />
      <line x1="80" y1="48" x2="80" y2="58" {...s} />
      <path d="M38 56c6-6 16-8 24-4l18 6M46 48l20 6M42 52h28" {...s} />
      <circle cx="48" cy="38" r="5" {...s} />
      <path d="M48 43v8M40 50l-5-3M56 50l5-3" {...s} />
    </Svg>
  );
}

/** Push-up — plank, arms extended */
export function PushUpIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="10" y1="78" x2="90" y2="78" {...s} strokeWidth={2} />
      <path d="M28 78 L50 48 L72 78" {...s} />
      <circle cx="50" cy="38" r="5" {...s} />
      <path d="M50 43v8M38 52l-8 4M62 52l8 4M50 52v18" {...s} />
    </Svg>
  );
}

/** Cable fly — standing, arms wide to narrow */
export function CableFlyIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M12 18v55M88 18v55" {...s} strokeWidth={2} />
      <path d="M12 30 Q50 55 50 62 M88 30 Q50 55 50 62" {...s} />
      <circle cx="50" cy="22" r="5" {...s} />
      <path d="M50 27v12M32 48l-8 6M68 48l8 6" {...s} />
    </Svg>
  );
}

/** Barbell row — hinged torso */
export function BarbellRowIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="18" y1="78" x2="82" y2="78" {...s} strokeWidth={2} />
      <path d="M38 78 L48 42 L58 78" {...s} />
      <circle cx="48" cy="34" r="5" {...s} />
      <path d="M48 39v6M30 52h36M34 48l-10-4M62 48l10-4" {...s} />
    </Svg>
  );
}

/** Pull-up — hang from bar */
export function PullUpIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="20" y1="22" x2="80" y2="22" {...s} strokeWidth={2.5} />
      <path d="M38 22v8M62 22v8" {...s} />
      <circle cx="50" cy="38" r="5" {...s} />
      <path d="M50 43v28M40 58l-6 14M60 58l6 14M42 52h16" {...s} />
    </Svg>
  );
}

/** Lat pulldown — seated, bar to chest */
export function LatPulldownIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="50" y1="12" x2="50" y2="38" {...s} />
      <path d="M38 12h24" {...s} strokeWidth={2.5} />
      <rect x="28" y="68" width="44" height="12" rx="2" {...s} />
      <circle cx="50" cy="48" r="5" {...s} />
      <path d="M50 53v12M42 62h16M38 74h24" {...s} />
    </Svg>
  );
}

/** Deadlift — bar at mid-shin, neutral back */
export function DeadliftIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="22" y1="72" x2="78" y2="72" {...s} strokeWidth={2.5} />
      <path d="M38 72 L46 38 L54 72" {...s} />
      <circle cx="50" cy="30" r="5" {...s} />
      <path d="M50 35v8M34 58h32M36 72l-8 8M64 72l8 8" {...s} />
    </Svg>
  );
}

/** RDL — hips back, bar tracks legs */
export function RomanianDeadliftIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="28" y1="68" x2="72" y2="68" {...s} strokeWidth={2} />
      <path d="M42 68 L50 40 L58 68" {...s} />
      <circle cx="50" cy="28" r="5" {...s} />
      <path d="M50 33v6M38 52h24M40 68l-6 8M60 68l6 8" {...s} />
    </Svg>
  );
}

/** Squat — bar on back, depth */
export function SquatIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M32 28h36" {...s} strokeWidth={2.5} />
      <circle cx="50" cy="22" r="5" {...s} />
      <path d="M50 27v12M38 42l-8 22M62 42l8 22M42 58h16M34 78h10M56 78h10" {...s} />
    </Svg>
  );
}

/** Leg press — feet on sled */
export function LegPressIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M18 32h64v40H18z" {...s} />
      <path d="M28 52 L38 72 M62 52 L52 72" {...s} />
      <circle cx="50" cy="42" r="5" {...s} />
      <path d="M50 47v8M42 58h16" {...s} />
    </Svg>
  );
}

/** Lunge — split stance */
export function LungeIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="10" y1="82" x2="90" y2="82" {...s} strokeWidth={2} />
      <circle cx="50" cy="28" r="5" {...s} />
      <path d="M50 33v14M38 52l-10 30M62 48l12 28" {...s} />
    </Svg>
  );
}

/** Leg curl — prone, heels to glutes */
export function LegCurlIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="12" y1="48" x2="88" y2="48" {...s} strokeWidth={2} />
      <ellipse cx="50" cy="52" rx="22" ry="8" {...s} />
      <circle cx="50" cy="32" r="5" {...s} />
      <path d="M50 37v10M42 52l6 18M58 52l-6 18" {...s} />
    </Svg>
  );
}

/** Calf raise — ankles extended */
export function CalfRaiseIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="20" y1="82" x2="80" y2="82" {...s} strokeWidth={2} />
      <rect x="38" y="78" width="24" height="6" {...s} />
      <circle cx="50" cy="38" r="5" {...s} />
      <path d="M50 43v32M42 78h16" {...s} />
    </Svg>
  );
}

/** OHP — press overhead */
export function OverheadPressIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M32 68h36" {...s} strokeWidth={2.5} />
      <circle cx="50" cy="52" r="5" {...s} />
      <path d="M50 57v8M32 38h36M38 38v-18M62 38v-18M42 68l-8 12M58 68l8 12" {...s} />
    </Svg>
  );
}

/** Lateral raise — arms abducted */
export function LateralRaiseIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <circle cx="50" cy="42" r="5" {...s} />
      <path d="M50 47v12M22 48h14M64 48h14M38 58l-6 22M62 58l6 22" {...s} />
    </Svg>
  );
}

/** Front raise */
export function FrontRaiseIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <circle cx="50" cy="58" r="5" {...s} />
      <path d="M50 63v14M50 28v22M38 28h24" {...s} />
      <path d="M42 68l-8 12M58 68l8 12" {...s} />
    </Svg>
  );
}

/** Face pull — rope to face, elbows high */
export function FacePullIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M50 12v22" {...s} />
      <circle cx="50" cy="42" r="5" {...s} />
      <path d="M50 47v18M32 52l-10 8M68 52l10 8M40 38l-8-6M60 38l8-6" {...s} />
    </Svg>
  );
}

/** Barbell curl */
export function BarbellCurlIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M22 38h56" {...s} strokeWidth={2.5} />
      <circle cx="50" cy="48" r="5" {...s} />
      <path d="M50 53v12M36 48l-6 18M64 48l6 18" {...s} />
    </Svg>
  );
}

/** Hammer curl — neutral */
export function HammerCurlIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M28 36h20M52 36h20" {...s} strokeWidth={2} />
      <circle cx="50" cy="50" r="5" {...s} />
      <path d="M50 55v14M40 48l-4 20M60 48l4 20" {...s} />
    </Svg>
  );
}

/** Tricep pushdown */
export function TricepPushdownIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M50 8v28" {...s} />
      <circle cx="50" cy="44" r="5" {...s} />
      <path d="M50 49v28M42 52h16M38 44l-6-4M62 44l6-4" {...s} />
    </Svg>
  );
}

/** Skull crusher — lying extension */
export function SkullCrusherIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="10" y1="62" x2="90" y2="62" {...s} strokeWidth={2} />
      <ellipse cx="50" cy="54" rx="18" ry="6" {...s} />
      <circle cx="50" cy="38" r="5" {...s} />
      <path d="M50 43v8M32 52h36M38 48l-8-6M62 48l8-6" {...s} />
    </Svg>
  );
}

/** Plank — rigid line */
export function PlankIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="8" y1="72" x2="92" y2="72" {...s} strokeWidth={2} />
      <path d="M22 72 L78 52" {...s} />
      <circle cx="82" cy="48" r="4" {...s} />
      <path d="M22 72v-4M30 72l8-20" {...s} />
    </Svg>
  );
}

/** Crunch — flexed spine */
export function CrunchIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M18 78 Q50 52 82 78" {...s} strokeWidth={2} />
      <circle cx="50" cy="48" r="5" {...s} />
      <path d="M50 53v12M38 62h24" {...s} />
    </Svg>
  );
}

/** Russian twist */
export function RussianTwistIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M30 72h40" {...s} strokeWidth={2} />
      <circle cx="50" cy="48" r="5" {...s} />
      <path d="M50 53v8M32 58l-8 6M68 58l8 6M42 62h16" {...s} />
    </Svg>
  );
}

/** Hanging leg raise */
export function HangingLegRaiseIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="25" y1="18" x2="75" y2="18" {...s} strokeWidth={2.5} />
      <path d="M42 18v6M58 18v6" {...s} />
      <circle cx="50" cy="34" r="5" {...s} />
      <path d="M50 39v22M38 58l-6 14M62 58l6 14" {...s} />
    </Svg>
  );
}

/** Running — stride */
export function RunningIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="10" y1="82" x2="90" y2="82" {...s} strokeWidth={2} />
      <circle cx="50" cy="28" r="5" {...s} />
      <path d="M50 33v10M38 48l-14 28M62 44l10 26M32 78l8-6M68 72l-6-8" {...s} />
    </Svg>
  );
}

/** Cycling */
export function CyclingIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <circle cx="32" cy="72" r="12" {...s} strokeWidth={2} />
      <circle cx="72" cy="72" r="12" {...s} strokeWidth={2} />
      <path d="M32 72 L50 38 L72 72 M44 48h12" {...s} />
      <circle cx="50" cy="28" r="5" {...s} />
    </Svg>
  );
}

/** Rowing machine */
export function RowingMachineIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M20 68h60v12H20z" {...s} />
      <circle cx="50" cy="38" r="5" {...s} />
      <path d="M50 43v12M28 52h44M32 56l-8 20M68 56l8 20" {...s} />
    </Svg>
  );
}

/** Jump rope */
export function JumpRopeIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M20 28 Q50 8 80 28" {...s} strokeWidth={2} />
      <circle cx="50" cy="48" r="5" {...s} />
      <path d="M50 53v24M38 78l-8-4M62 78l8-4" {...s} />
    </Svg>
  );
}

/** Hip mobility — leg swing */
export function HipMobilityIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <line x1="20" y1="82" x2="80" y2="82" {...s} strokeWidth={2} />
      <circle cx="50" cy="38" r="5" {...s} />
      <path d="M50 43v18M38 58l-12 22M48 52 Q68 32 72 48" {...s} />
    </Svg>
  );
}

/** Shoulder mobility — arm arc */
export function ShoulderMobilityIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <circle cx="50" cy="52" r="5" {...s} />
      <path d="M50 57v14M50 22 Q22 38 28 58M50 22 Q78 38 72 58" {...s} />
      <path d="M42 72l-8 8M58 72l8 8" {...s} />
    </Svg>
  );
}

/** Cat-cow — two spine curves */
export function CatCowIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M20 58 Q50 42 80 58" {...s} strokeWidth={2} />
      <path d="M22 68 Q50 88 78 68" {...s} opacity={0.55} />
      <circle cx="50" cy="38" r="4" {...s} />
      <path d="M38 56l-8 6M62 56l8 6" {...s} />
    </Svg>
  );
}

/** Unknown / custom exercise — generic active pose */
export function DefaultExerciseIllustration({ className }: P) {
  return (
    <Svg className={className}>
      <path d="M12 88 Q50 72 88 88" {...s} opacity={0.35} strokeWidth={1.5} />
      <circle cx="50" cy="36" r="7" {...s} />
      <path d="M50 43v20M34 58h32M36 68l-10 18M64 68l10 18" {...s} />
      <path d="M28 52 L38 44 M72 52 L62 44" {...s} opacity={0.9} />
    </Svg>
  );
}

export const EXERCISE_ILLUSTRATION_BY_SLUG: Record<string, ComponentType<{ className?: string }>> = {
  "bench-press": BenchPressIllustration,
  "incline-bench-press": InclineBenchPressIllustration,
  "push-up": PushUpIllustration,
  "cable-fly": CableFlyIllustration,
  "barbell-row": BarbellRowIllustration,
  "pull-up": PullUpIllustration,
  "lat-pulldown": LatPulldownIllustration,
  "deadlift": DeadliftIllustration,
  "romanian-deadlift": RomanianDeadliftIllustration,
  "squat": SquatIllustration,
  "leg-press": LegPressIllustration,
  "lunge": LungeIllustration,
  "leg-curl": LegCurlIllustration,
  "calf-raise": CalfRaiseIllustration,
  "overhead-press": OverheadPressIllustration,
  "lateral-raise": LateralRaiseIllustration,
  "front-raise": FrontRaiseIllustration,
  "face-pull": FacePullIllustration,
  "barbell-curl": BarbellCurlIllustration,
  "hammer-curl": HammerCurlIllustration,
  "tricep-pushdown": TricepPushdownIllustration,
  "skull-crusher": SkullCrusherIllustration,
  "plank": PlankIllustration,
  "crunch": CrunchIllustration,
  "russian-twist": RussianTwistIllustration,
  "hanging-leg-raise": HangingLegRaiseIllustration,
  running: RunningIllustration,
  cycling: CyclingIllustration,
  "rowing-machine": RowingMachineIllustration,
  "jump-rope": JumpRopeIllustration,
  "hip-mobility": HipMobilityIllustration,
  "shoulder-mobility": ShoulderMobilityIllustration,
  "cat-cow": CatCowIllustration,
};
