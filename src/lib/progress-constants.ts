export const PROGRESS_PHOTOS_BUCKET = "progress-photos" as const;

/** Stored in body_metrics.measurements (values in cm). */
export const MEASUREMENT_KEYS = [
  "chest_cm",
  "waist_cm",
  "hips_cm",
  "arm_cm",
  "leg_cm",
] as const;

export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  chest_cm: "Chest",
  waist_cm: "Waist",
  hips_cm: "Hips",
  arm_cm: "Arms",
  leg_cm: "Legs",
};

/** Region copy for body diagram callouts (Chest → upper torso, etc.). */
export const MEASUREMENT_REGIONS: Record<MeasurementKey, string> = {
  chest_cm: "Upper torso",
  waist_cm: "Midsection",
  hips_cm: "Hip area",
  arm_cm: "Upper arm",
  leg_cm: "Thigh",
};
