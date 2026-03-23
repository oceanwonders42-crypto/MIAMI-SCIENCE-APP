/** Normalized payload for reorder reminder email. */
export interface ReorderReminderPayload {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
}

/** Normalized payload for comeback reminder email. */
export interface ComebackReminderPayload {
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
}

/** Normalized payload for weekly recap email. */
export interface WeeklyRecapPayload {
  weekLabel: string;
  workoutsThisWeek: number;
  checkInsThisWeek: number;
  checkInStreak: number;
  workoutStreak: number;
  lowSupplyCount: number;
  pointsBalance: number;
  pointsChangeThisWeek: number;
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  refillUrgency: "none" | "soon" | "low" | "critical";
}

export interface RenderedEmail {
  subject: string;
  html: string;
}
