import { getEvents } from "@/lib/data/events";
import { getCurrentMember } from "@/lib/data/members";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function utcStamp(date: string, time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hour = match ? Number(match[1]) % 12 : 12;
  if (match?.[3].toUpperCase() === "PM") hour += 12;
  const minute = match?.[2] ?? "00";
  const value = new Date(`${date}T${String(hour).padStart(2, "0")}:${minute}:00-04:00`);
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
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
      `DTSTART:${utcStamp(event.date, event.time)}`,
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
