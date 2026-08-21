export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// The club meets in the British Virgin Islands, so "today" for birthday
// recognition is BVI local time — not the server's timezone (Vercel runs
// UTC), which would flip the day at the wrong hour for anyone here.
const CLUB_TIME_ZONE = "America/Tortola";

/**
 * The current month/day in the club's local timezone, as "MM-DD" — the same
 * slice you'd get from a YYYY-MM-DD date string, so it can be compared
 * directly against `dateOfBirth.slice(5)`.
 */
export function todayMonthDay(timeZone: string = CLUB_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${month}-${day}`;
}

/** A birthday's month and day, with no year (the year on file isn't the point). */
export function formatBirthday(iso: string) {
  return formatDate(iso, { year: undefined, month: "long", day: "numeric" });
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Whole days from `fromIso` to `toIso` (both YYYY-MM-DD), positive when `to`
 * is the later date. Computed in UTC so the answer doesn't shift with the
 * viewer's timezone, and so it stays identical between server and client.
 */
export function daysBetween(fromIso: string, toIso: string) {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}
