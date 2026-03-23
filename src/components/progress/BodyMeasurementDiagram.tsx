import type { ProfileGender } from "@/types";
import type { PreferredUnits } from "@/lib/units";
import { formatLengthCm } from "@/lib/units";
import {
  MEASUREMENT_KEYS,
  MEASUREMENT_LABELS,
  MEASUREMENT_REGIONS,
  type MeasurementKey,
} from "@/lib/progress-constants";
import { cn } from "@/lib/utils";

type FigureVariant = "male" | "female" | "neutral";

function figureVariant(gender: ProfileGender | null | undefined): FigureVariant {
  if (gender === "male") return "male";
  if (gender === "female") return "female";
  return "neutral";
}

/** Original diagram space (0–120 × 0–200); scaled in render. */
const S = { ox: 52, oy: 18, sc: 2.42 };

function T(x: number, y: number): { x: number; y: number } {
  return { x: S.ox + x * S.sc, y: S.oy + y * S.sc };
}

/** Leader line anchors (original coords) → labels. */
const ANCHORS: Record<
  MeasurementKey,
  { ox: number; oy: number; side: "left" | "right" }
> = {
  chest_cm: { ox: 82, oy: 56, side: "right" },
  waist_cm: { ox: 86, oy: 88, side: "right" },
  hips_cm: { ox: 88, oy: 118, side: "right" },
  arm_cm: { ox: 24, oy: 76, side: "left" },
  leg_cm: { ox: 52, oy: 158, side: "right" },
};

/** Label box positions (world space). */
const LABEL_BOX: Record<
  MeasurementKey,
  { x: number; y: number; w: number; h: number; align: "left" | "right" }
> = {
  chest_cm: { x: 288, y: 52, w: 118, h: 46, align: "left" },
  waist_cm: { x: 288, y: 98, w: 118, h: 46, align: "left" },
  hips_cm: { x: 288, y: 144, w: 118, h: 46, align: "left" },
  leg_cm: { x: 288, y: 206, w: 118, h: 46, align: "left" },
  arm_cm: { x: 8, y: 108, w: 118, h: 46, align: "left" },
};

function torsoPath(v: FigureVariant): string {
  switch (v) {
    case "male":
      return "M60 38 L40 50 L36 110 L40 145 L46 175 L74 175 L80 145 L84 110 L80 50 Z";
    case "female":
      return "M60 38 L49 54 L45 102 L47 142 L51 175 L69 175 L73 142 L75 102 L71 54 Z";
    default:
      return "M60 38 L45 52 L40 110 L42 145 L48 175 L72 175 L78 145 L80 110 L75 52 Z";
  }
}

export function BodyMeasurementDiagram({
  gender,
  preferredUnits,
  latestCm,
}: {
  gender: ProfileGender | null | undefined;
  preferredUnits: PreferredUnits;
  latestCm: Partial<Record<MeasurementKey, number>>;
}) {
  const variant = figureVariant(gender ?? null);
  const tp = torsoPath(variant);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-500/10 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black p-5 sm:p-6 shadow-[0_0_80px_-20px_rgba(16,185,129,0.15)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(16,185,129,0.08),transparent_55%)]"
        aria-hidden
      />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500/80 mb-1">
          Body scan
        </p>
        <p className="text-xs text-zinc-500 mb-4">
          {variant === "neutral"
            ? "Neutral silhouette — set gender in account for a tailored figure."
            : `${variant === "male" ? "Male" : "Female"} silhouette — measurements map to each zone.`}
        </p>

        <svg
          viewBox="0 0 420 300"
          className="mx-auto h-auto w-full max-w-[400px]"
          fill="none"
          aria-hidden
        >
          <defs>
            <filter id="emeraldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Figure */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Head */}
            <ellipse
              cx={T(60, 22).x}
              cy={T(60, 22).y}
              rx={14 * S.sc}
              ry={16 * S.sc}
              className={cn(
                "transition-colors duration-300",
                MEASUREMENT_KEYS.some((k) => latestCm[k] != null)
                  ? "stroke-zinc-500/90"
                  : "stroke-zinc-600/50"
              )}
              strokeWidth={1.6}
            />
            {/* Torso */}
            <path
              d={tp}
              transform={`translate(${S.ox},${S.oy}) scale(${S.sc})`}
              className={cn(
                "transition-colors duration-300",
                MEASUREMENT_KEYS.some((k) => latestCm[k] != null)
                  ? "stroke-zinc-400/85"
                  : "stroke-zinc-600/45"
              )}
              strokeWidth={1.65}
              fill="rgba(24,24,27,0.35)"
            />
            {/* Arms */}
            <path
              d="M45 54 L28 72 L22 118"
              transform={`translate(${S.ox},${S.oy}) scale(${S.sc})`}
              className={cn(
                "transition-colors duration-300",
                latestCm.arm_cm != null ? "stroke-emerald-400/90" : "stroke-zinc-600/45"
              )}
              strokeWidth={latestCm.arm_cm != null ? 2.1 : 1.5}
              filter={latestCm.arm_cm != null ? "url(#softGlow)" : undefined}
            />
            <path
              d="M75 54 L92 72 L98 118"
              transform={`translate(${S.ox},${S.oy}) scale(${S.sc})`}
              className={cn(
                "transition-colors duration-300",
                MEASUREMENT_KEYS.some((k) => latestCm[k] != null)
                  ? "stroke-zinc-500/70"
                  : "stroke-zinc-600/40"
              )}
              strokeWidth={1.5}
            />
            {/* Legs */}
            <path
              d="M48 175 L44 198"
              transform={`translate(${S.ox},${S.oy}) scale(${S.sc})`}
              className={cn(
                "transition-colors duration-300",
                latestCm.leg_cm != null ? "stroke-emerald-400/90" : "stroke-zinc-600/45"
              )}
              strokeWidth={latestCm.leg_cm != null ? 2.1 : 1.5}
              filter={latestCm.leg_cm != null ? "url(#softGlow)" : undefined}
            />
            <path
              d="M72 175 L76 198"
              transform={`translate(${S.ox},${S.oy}) scale(${S.sc})`}
              className={cn(
                "transition-colors duration-300",
                MEASUREMENT_KEYS.some((k) => latestCm[k] != null)
                  ? "stroke-zinc-500/70"
                  : "stroke-zinc-600/40"
              )}
              strokeWidth={1.5}
            />

            {/* Zone overlays */}
            <ZoneDot
              active={latestCm.chest_cm != null}
              cx={60}
              cy={58}
              r={14}
            />
            <ZoneDot
              active={latestCm.waist_cm != null}
              cx={60}
              cy={88}
              r={13}
            />
            <ZoneDot
              active={latestCm.hips_cm != null}
              cx={60}
              cy={118}
              r={15}
            />
            <ZoneDot active={latestCm.arm_cm != null} cx={32} cy={78} r={10} />
            <ZoneDot active={latestCm.leg_cm != null} cx={52} cy={158} r={12} />
          </g>

          {/* Leader lines + labels */}
          {MEASUREMENT_KEYS.map((key) => {
            const a = ANCHORS[key];
            const p0 = T(a.ox, a.oy);
            const box = LABEL_BOX[key];
            const midX =
              a.side === "right"
                ? p0.x + (box.x - p0.x) * 0.55
                : p0.x - (p0.x - (box.x + box.w)) * 0.55;
            const midY = p0.y + (box.y + box.h / 2 - p0.y) * 0.45;
            const val = latestCm[key];
            const has = val != null && Number.isFinite(val);
            const text = has ? formatLengthCm(val, preferredUnits) : "—";
            const tx = box.x + box.w / 2;
            const tyRegion = box.y + 16;
            const tyVal = box.y + 34;

            return (
              <g key={key}>
                <path
                  d={`M ${p0.x} ${p0.y} Q ${midX} ${midY} ${box.x} ${box.y + box.h / 2}`}
                  className={cn(
                    "fill-none transition-colors",
                    has ? "stroke-emerald-500/55" : "stroke-zinc-600/35"
                  )}
                  strokeWidth={has ? 1.35 : 1}
                  strokeDasharray={has ? undefined : "4 3"}
                />
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={10}
                  className={cn(
                    "transition-colors",
                    has
                      ? "fill-black/55 stroke-emerald-500/35"
                      : "fill-black/40 stroke-zinc-700/50"
                  )}
                  strokeWidth={1}
                />
                <text
                  x={tx}
                  y={tyRegion}
                  textAnchor="middle"
                  className="fill-zinc-500"
                  style={{ fontSize: 9 }}
                >
                  {MEASUREMENT_REGIONS[key]}
                </text>
                <text
                  x={tx}
                  y={tyVal}
                  textAnchor="middle"
                  className={has ? "fill-emerald-300" : "fill-zinc-600"}
                  style={{ fontSize: 12, fontWeight: 700 }}
                >
                  {text}
                </text>
                <text
                  x={tx}
                  y={tyVal + 14}
                  textAnchor="middle"
                  className="fill-zinc-500"
                  style={{ fontSize: 9 }}
                >
                  {MEASUREMENT_LABELS[key]}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="mt-4 text-center text-[11px] text-zinc-600">
          Emerald = latest logged value. Grey zones have no data yet.
        </p>
      </div>
    </div>
  );
}

function ZoneDot({
  active,
  cx,
  cy,
  r,
}: {
  active: boolean;
  cx: number;
  cy: number;
  r: number;
}) {
  const p = T(cx, cy);
  const rr = r * S.sc;
  return (
    <circle
      cx={p.x}
      cy={p.y}
      r={rr}
      className={cn(
        "pointer-events-none transition-all duration-300",
        active
          ? "fill-emerald-400/25 stroke-emerald-400/80"
          : "fill-zinc-800/25 stroke-zinc-600/25"
      )}
      strokeWidth={active ? 2 : 1.2}
      filter={active ? "url(#emeraldGlow)" : undefined}
    />
  );
}
