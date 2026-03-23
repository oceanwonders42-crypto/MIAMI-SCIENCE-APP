/**
 * Calendar date YYYY-MM-DD in a specific IANA timezone (for daily logs / streaks).
 */
export function calendarDateInTimeZone(timeZone: string, d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Short label for UI, e.g. "Tue, Mar 17" in the user's timezone. */
export function formatCalendarDateLabel(timeZone: string, d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return calendarDateInTimeZone(timeZone, d);
  }
}
