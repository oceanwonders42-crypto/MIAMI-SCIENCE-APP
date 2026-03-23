/**
 * BMI (informational only — not medical advice).
 * Standard WHO cutoffs for adults.
 */

export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export function bmiFromMetric(weightKg: number, heightCm: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0 || weightKg <= 0) {
    return null;
  }
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function bmiLabel(cat: BmiCategory): string {
  switch (cat) {
    case "underweight":
      return "Underweight";
    case "normal":
      return "Normal";
    case "overweight":
      return "Overweight";
    case "obese":
      return "Obese";
    default:
      return "—";
  }
}

/** One-line copy for UI */
export function bmiDescription(cat: BmiCategory): string {
  switch (cat) {
    case "underweight":
      return "Below the typical healthy range for most adults.";
    case "normal":
      return "Within the range often associated with lower health risk.";
    case "overweight":
      return "Above normal range — discuss goals with your clinician if needed.";
    case "obese":
      return "Well above normal range — seek professional guidance for a safe plan.";
    default:
      return "";
  }
}

/** Map BMI to 0–1 position on a display scale (clamp 15–40). */
export function bmiGaugePosition(bmi: number): number {
  const min = 15;
  const max = 40;
  const t = (bmi - min) / (max - min);
  return Math.min(1, Math.max(0, t));
}
