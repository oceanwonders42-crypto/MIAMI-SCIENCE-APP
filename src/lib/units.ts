/**
 * Unit formatting for display. Data is stored in metric (kg, cm).
 * preferred_units from profile: "metric" | "imperial".
 */

const KG_TO_LB = 2.205;
const CM_TO_IN = 0.393701;

export type PreferredUnits = "metric" | "imperial";

/** Format weight for display. Pass value in kg; returns e.g. "72 kg" or "158.7 lb". */
export function formatWeight(kg: number | null | undefined, units: PreferredUnits): string {
  if (kg == null || !Number.isFinite(kg)) return "—";
  if (units === "imperial") {
    const lb = kg * KG_TO_LB;
    return `${lb.toFixed(1)} lb`;
  }
  return `${Number(kg)} kg`;
}

/** Format linear measurement (circumference) stored in cm. */
export function formatLengthCm(cm: number | null | undefined, units: PreferredUnits): string {
  if (cm == null || !Number.isFinite(cm)) return "—";
  if (units === "imperial") {
    const inch = cm * CM_TO_IN;
    return `${inch.toFixed(1)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}

/** Format height for display. Pass value in cm; returns e.g. "175 cm" or "68.9 in". */
export function formatHeight(cm: number | null | undefined, units: PreferredUnits): string {
  if (cm == null || !Number.isFinite(cm)) return "—";
  if (units === "imperial") {
    const inch = cm * CM_TO_IN;
    return `${inch.toFixed(1)} in`;
  }
  return `${Number(cm)} cm`;
}

/** Convert lb to kg for storage. */
export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

/** Convert in to cm for storage. */
export function inToCm(inch: number): number {
  return inch / CM_TO_IN;
}

/** Label for weight input by units. */
export function weightLabel(units: PreferredUnits): string {
  return units === "imperial" ? "Weight (lb)" : "Weight (kg)";
}

/** Label for height input by units. */
export function heightLabel(units: PreferredUnits): string {
  return units === "imperial" ? "Height (in)" : "Height (cm)";
}

/** Split cm into feet + inches (whole inches 0–11 for fractional part). */
export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = cm * CM_TO_IN;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  if (inch === 12) return { ft: ft + 1, inch: 0 };
  return { ft, inch: Math.min(11, Math.max(0, inch)) };
}

/** Feet + inches → cm. */
export function ftInToCm(ft: number, inch: number): number {
  const totalIn = ft * 12 + inch;
  return inToCm(totalIn);
}

