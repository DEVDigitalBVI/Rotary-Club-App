import type { EventItem } from "@/lib/club";

export function rotaryYear(today: string) {
  const year = Number(today.slice(0, 4));
  const startYear = Number(today.slice(5, 7)) >= 7 ? year : year - 1;
  return { start: `${startYear}-07-01`, end: `${startYear + 1}-07-01`, label: `${startYear}–${String(startYear + 1).slice(-2)}` };
}

export type PersonalHoursRow = { hours: number | string; approved_at?: string | null };

// All recorded hours count immediately; legacy approval fields do not affect totals.
export function summarizePersonalHours(rows: PersonalHoursRow[]) {
  return { total: rows.reduce((total, row) => total + Number(row.hours), 0) };
}

export function upcomingEvents(events: EventItem[], now = new Date()) {
  return events.filter((event) =>
    event.startsAt && Date.parse(event.endsAt ?? event.startsAt) >= now.getTime()
  ).sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!));
}

export function upcomingPersonalRsvps(events: EventItem[], now = new Date()) {
  return upcomingEvents(events, now).filter((event) => event.myRsvp === "yes" || event.myRsvp === "maybe");
}
