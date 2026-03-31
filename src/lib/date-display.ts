/**
 * Locale- and timezone-stable formatters for SSR + client hydration (avoid React #418 text mismatches).
 */

const UTC_CAL: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
};

const UTC_DT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
};

/** Daily check-in card heading from `YYYY-MM-DD` (UTC calendar day). */
export function formatCheckInHeadingDate(ymdUtc: string): string {
  const parts = ymdUtc.trim().split("-").map((s) => parseInt(s, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return ymdUtc;
  const [y, m, d] = parts;
  return new Intl.DateTimeFormat("en-US", UTC_CAL).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Meal log / chat timestamps from ISO strings (UTC display — stable everywhere). */
export function formatTimestampUtcEnUS(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", UTC_DT).format(new Date(iso));
  } catch {
    return iso;
  }
}
