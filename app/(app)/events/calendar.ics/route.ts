import { getEvents } from "@/lib/data/events";
import { getCurrentMember } from "@/lib/data/members";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function utcStamp(instant: string) {
  return new Date(instant).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET() {
  const member = await getCurrentMember();
  if (!member || member.status === "inactive") return new Response("Unauthorized", { status: 401 });

  const events = await getEvents();
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rotary Club of Road Town//Member House//EN",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.id}@rotaryroadtown.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${utcStamp(event.startsAt)}`,
      ...(event.endsAt ? [`DTEND:${utcStamp(event.endsAt)}`] : []),
      `SUMMARY:${escapeIcs(event.title)}`,
      ...(event.location ? [`LOCATION:${escapeIcs(event.location)}`] : []),
      ...(event.description ? [`DESCRIPTION:${escapeIcs(event.description)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];

  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="road-town-rotary-calendar.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
