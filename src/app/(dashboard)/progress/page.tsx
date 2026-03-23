import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import {
  getBodyMetrics,
  getBodyweightTrendSummary,
  getLastTwoWeightDeltaKg,
  latestMeasurementsPerKey,
} from "@/lib/body-metrics";
import { getExercisePRs } from "@/lib/exercise-history";
import {
  weightSeriesKg,
  bodyFatSeries,
  measurementSeriesCm,
  type SeriesPoint,
} from "@/lib/body-metric-series";
import { progressPercentTowardGoal } from "@/lib/goal-progress";
import { listProgressPhotos, signProgressPhotoUrls } from "@/lib/progress-photos";
import { MEASUREMENT_KEYS, MEASUREMENT_LABELS, type MeasurementKey } from "@/lib/progress-constants";
import { formatWeight } from "@/lib/units";
import { Header } from "@/components/layout/Header";
import { BodyMetricsForm } from "./BodyMetricsForm";
import { MetricsEntriesList } from "./MetricsEntriesList";
import { GoalsForm } from "./GoalsForm";
import { ProgressPhotosClient } from "./ProgressPhotosClient";
import { PhotoCompareClient } from "./PhotoCompareClient";
import { SimpleTrendChart } from "@/components/progress/SimpleTrendChart";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { ROUTES } from "@/lib/constants";
import type { PreferredUnits } from "@/lib/units";
import { Badge } from "@/components/ui/Badge";
import { ProgressHero } from "@/components/progress/ProgressHero";
import { BMICalculatorCard } from "@/components/progress/BMICalculatorCard";
import { BodyMeasurementDiagram } from "@/components/progress/BodyMeasurementDiagram";

function weightToDisplayPoints(series: SeriesPoint[], units: PreferredUnits) {
  return series.map((p) => ({
    at: p.at,
    value: units === "imperial" ? p.value * 2.205 : p.value,
  }));
}

function cmToDisplayPoints(series: SeriesPoint[], units: PreferredUnits) {
  const CM_TO_IN = 0.393701;
  return series.map((p) => ({
    at: p.at,
    value: units === "imperial" ? p.value * CM_TO_IN : p.value,
  }));
}

export default async function ProgressPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";
  const [metrics, prs, profile, rawPhotos] = await Promise.all([
    getBodyMetrics(supabase, userId, 120),
    getExercisePRs(supabase, userId),
    getProfile(supabase, userId),
    listProgressPhotos(supabase, userId, 80),
  ]);
  const photosSigned = await signProgressPhotoUrls(supabase, rawPhotos, 3600);
  const trend = getBodyweightTrendSummary(metrics);
  const recentDelta = getLastTwoWeightDeltaKg(metrics);
  const preferredUnits: PreferredUnits =
    profile?.preferred_units === "imperial" ? "imperial" : "metric";
  const heightCm =
    profile?.height_cm != null && Number.isFinite(profile.height_cm)
      ? Number(profile.height_cm)
      : null;

  const wKgSeries = weightSeriesKg(metrics);
  const wDisplay = weightToDisplayPoints(wKgSeries, preferredUnits);
  const lastWLabel =
    wDisplay.length > 0
      ? preferredUnits === "imperial"
        ? `${wDisplay[wDisplay.length - 1]!.value.toFixed(1)} lb`
        : `${wDisplay[wDisplay.length - 1]!.value.toFixed(1)} kg`
      : "—";

  const bfS = bodyFatSeries(metrics);
  const lastBfLabel =
    bfS.length > 0 ? `${bfS[bfS.length - 1]!.value.toFixed(1)}%` : "—";

  const goalW = profile?.goal_weight_kg ?? null;
  const goalBf = profile?.goal_body_fat_percent ?? null;
  const weightProgress =
    goalW != null && trend.lastWeight != null
      ? progressPercentTowardGoal(trend.lastWeight, goalW, trend.firstWeight)
      : null;
  const firstBf = bfS[0]?.value ?? null;
  const lastBf = bfS.length > 0 ? bfS[bfS.length - 1]!.value : null;
  const bfProgress =
    goalBf != null && lastBf != null
      ? progressPercentTowardGoal(lastBf, goalBf, firstBf)
      : null;

  const goalsFormKey = `${goalW ?? "nw"}-${goalBf ?? "nbf"}`;
  const latestCm = latestMeasurementsPerKey(metrics);

  return (
    <div className="min-h-full bg-zinc-950 pb-28 md:pb-10">
      <Header
        title="Progress"
        subtitle="Metrics · photos · goals"
        className="border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-md"
        action={<BodyMetricsForm preferredUnits={preferredUnits} />}
      />

      <div className="px-4 md:px-8 max-w-5xl mx-auto space-y-8 pt-6 pb-10">
        <ProgressHero
          lastWeightKg={trend.lastWeight}
          lastWeightDate={trend.lastDate}
          recentDeltaKg={recentDelta}
          preferredUnits={preferredUnits}
        />

        <section className="rounded-3xl border border-primary-500/15 bg-gradient-to-br from-zinc-900/60 via-zinc-950 to-zinc-950 p-5 sm:p-6 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-400/90">Quick log</p>
              <p className="mt-1 text-sm text-zinc-400">Weight, body fat, measurements — one tap</p>
            </div>
            <BodyMetricsForm preferredUnits={preferredUnits} />
          </div>
        </section>

        <BMICalculatorCard
          key={`bmi-${heightCm ?? "x"}-${preferredUnits}`}
          preferredUnits={preferredUnits}
          initialHeightCm={heightCm}
          latestWeightKg={trend.lastWeight}
        />

        <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6 space-y-5 shadow-xl shadow-black/20">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Goals</p>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4 sm:p-5 space-y-4">
              <p className="text-sm font-bold text-zinc-100">Progress to targets</p>
              {goalW != null && weightProgress != null && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                    <span>Weight goal</span>
                    <span className="tabular-nums text-emerald-400/90">{weightProgress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                      style={{ width: `${weightProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    Now {formatWeight(trend.lastWeight, preferredUnits)} → goal{" "}
                    {formatWeight(goalW, preferredUnits)}
                  </p>
                </div>
              )}
              {goalBf != null && bfProgress != null && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                    <span>Body fat goal</span>
                    <span className="tabular-nums text-teal-400/90">{bfProgress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-400 transition-all duration-500"
                      style={{ width: `${bfProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    Now {lastBf?.toFixed(1) ?? "—"}% → goal {goalBf}%
                  </p>
                </div>
              )}
              {goalW == null && goalBf == null && (
                <p className="text-sm text-zinc-500">
                  Set weight and body-fat targets below — we&apos;ll visualize how close you are.
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4 sm:p-5">
              <p className="text-sm font-bold text-zinc-100 mb-3">Your targets</p>
              <GoalsForm
                key={goalsFormKey}
                preferredUnits={preferredUnits}
                goalWeightKg={goalW}
                goalBodyFat={goalBf}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3 px-0.5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-400/85">Trends</p>
              <p className="text-sm text-zinc-500 mt-0.5">Gradient charts — your data over time</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SimpleTrendChart
              title={preferredUnits === "imperial" ? "Weight (lb)" : "Weight (kg)"}
              points={wDisplay}
              valueLabel={lastWLabel}
              accent="emerald"
            />
            <SimpleTrendChart
              title="Body fat %"
              points={bfS}
              valueLabel={lastBfLabel}
              accent="teal"
            />
            {MEASUREMENT_KEYS.map((key: MeasurementKey) => {
              const raw = measurementSeriesCm(metrics, key);
              if (raw.length < 2) return null;
              const disp = cmToDisplayPoints(raw, preferredUnits);
              const last = disp[disp.length - 1]!;
              const unit = preferredUnits === "imperial" ? "in" : "cm";
              return (
                <SimpleTrendChart
                  key={key}
                  title={`${MEASUREMENT_LABELS[key]} (${unit})`}
                  points={disp}
                  valueLabel={`${last.value.toFixed(1)} ${unit}`}
                />
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/35 p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Snapshot</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/30 border border-white/[0.06] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Entries</p>
                <p className="text-2xl font-black text-white tabular-nums mt-1">{metrics.length}</p>
              </div>
              {trend.delta != null && (
                <div className="rounded-2xl bg-black/30 border border-white/[0.06] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Overall Δ</p>
                  <p
                    className={`text-xl font-black tabular-nums mt-1 ${
                      trend.delta <= 0 ? "text-emerald-400/90" : "text-red-400/85"
                    }`}
                  >
                    {preferredUnits === "imperial"
                      ? `${trend.delta >= 0 ? "+" : ""}${(trend.delta * 2.205).toFixed(1)} lb`
                      : `${trend.delta >= 0 ? "+" : ""}${trend.delta.toFixed(1)} kg`}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">First → latest log</p>
                </div>
              )}
            </div>
          </section>
          <BodyMeasurementDiagram
            gender={profile?.gender ?? null}
            preferredUnits={preferredUnits}
            latestCm={latestCm}
          />
        </div>

        <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Progress photos</p>
            <p className="text-sm text-zinc-500 mt-1">
              Private to your account. On iOS use camera or library; on web, choose a file.
            </p>
          </div>
          <ProgressPhotosClient photos={photosSigned} />
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Before / after</p>
            <p className="text-sm text-zinc-500 mt-1">Drag the slider to compare two dates.</p>
          </div>
          <PhotoCompareClient
            key={photosSigned.map((p) => p.id).join("-")}
            photos={photosSigned}
          />
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/35 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Recent logs</p>
            <BodyMetricsForm preferredUnits={preferredUnits} />
          </div>
          <MetricsEntriesList metrics={metrics} preferredUnits={preferredUnits} />
        </section>

        {prs.length > 0 && (
          <section className="rounded-3xl border border-white/[0.08] bg-zinc-900/35 p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Training PRs</p>
            <p className="text-xs text-zinc-500 mb-3">From your workout history</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {prs.slice(0, 8).map((pr) => (
                <Badge key={`${pr.exerciseName}-${pr.maxWeight}`} variant="success">
                  {pr.exerciseName}: {formatWeight(pr.maxWeight, preferredUnits)}
                </Badge>
              ))}
            </div>
            <Link
              href={ROUTES.training}
              className="text-sm font-bold text-emerald-400/90 hover:text-emerald-300 transition-colors"
            >
              Go to training →
            </Link>
          </section>
        )}

        <Disclaimer compact className="text-center text-zinc-600" />
      </div>
    </div>
  );
}
