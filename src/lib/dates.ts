/** Returns today's date as YYYY-MM-DD in the user's local timezone (not UTC). */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD date string as noon UTC so the date is stable across
 * all timezones. Use when storing user-supplied dates in the DB.
 */
export function parseDateToUTCNoon(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00.000Z`);
}
