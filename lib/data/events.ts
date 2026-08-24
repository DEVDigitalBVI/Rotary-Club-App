import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { getCurrentMember } from "@/lib/data/members";
import { formatTime, toClubDateString } from "@/lib/format";
import type { EventItem } from "@/lib/mock-data";

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  is_virtual: boolean;
  counts_toward_attendance: boolean;
  description: string | null;
  speaker_name: string | null;
  speaker_topic: string | null;
  rsvp_deadline: string | null;
  attendance_present: number | null;
  attendance_total: number | null;
  flyer_url: string | null;
  flyer_alt: string | null;
  agenda_file_name: string | null;
  agenda_url: string | null;
  agenda_uploaded_at: string | null;
  agenda_size_label: string | null;
};

type RsvpRow = { event_id: string; member_id: string; status: "yes" | "no" | "maybe" };

function toEventItem(
  row: EventRow,
  rsvps: RsvpRow[],
  currentMemberId: string | null
): EventItem {
  const own = currentMemberId ? rsvps.find((r) => r.member_id === currentMemberId) : undefined;
  const counts = { yes: 0, no: 0, maybe: 0 };
  for (const r of rsvps) counts[r.status]++;

  return {
    id: row.id,
    title: row.title,
    date: toClubDateString(row.starts_at),
    time: row.ends_at
      ? `${formatTime(row.starts_at)} – ${formatTime(row.ends_at)}`
      : formatTime(row.starts_at),
    location: row.location ?? "",
    isVirtual: row.is_virtual,
    countsTowardAttendance: row.counts_toward_attendance,
    description: row.description ?? "",
    speaker: row.speaker_name
      ? { name: row.speaker_name, topic: row.speaker_topic ?? "" }
      : undefined,
    rsvpDeadline: row.rsvp_deadline ?? undefined,
    rsvps: counts,
    myRsvp: own?.status ?? "none",
    attendance:
      row.attendance_present != null && row.attendance_total != null
        ? { present: row.attendance_present, total: row.attendance_total }
        : undefined,
    // Before attendance is finalized, "who's confirmed" is approximated as
    // everyone who RSVP'd yes. The detail page replaces this with real rows.
    attendeeIds: rsvps.filter((r) => r.status === "yes").map((r) => r.member_id),
    flyer: row.flyer_url ? { url: row.flyer_url, alt: row.flyer_alt ?? row.title } : undefined,
    agenda: row.agenda_url
      ? {
          fileName: row.agenda_file_name ?? "Agenda",
          url: row.agenda_url,
          uploadedAt: row.agenda_uploaded_at ?? "",
          sizeLabel: row.agenda_size_label ?? undefined,
        }
      : undefined,
  };
}

function groupByEvent(rows: RsvpRow[]) {
  const byEvent = new Map<string, RsvpRow[]>();
  for (const row of rows) {
    const list = byEvent.get(row.event_id) ?? [];
    list.push(row);
    byEvent.set(row.event_id, list);
  }
  return byEvent;
}

export async function getEvents(): Promise<EventItem[]> {
  const supabase = await createClient();
  const [eventsResult, rsvpsResult, currentMember] = await Promise.all([
    supabase.from("events").select("*").order("starts_at").returns<EventRow[]>(),
    supabase.from("event_rsvps").select("event_id, member_id, status").returns<RsvpRow[]>(),
    getCurrentMember(),
  ]);
  throwOnSupabaseError(eventsResult.error, "Unable to load events");
  throwOnSupabaseError(rsvpsResult.error, "Unable to load event RSVPs");

  const rsvpsByEvent = groupByEvent(rsvpsResult.data ?? []);
  return (eventsResult.data ?? []).map((row) =>
    toEventItem(row, rsvpsByEvent.get(row.id) ?? [], currentMember?.id ?? null)
  );
}

export async function getEventById(id: string): Promise<EventItem | null> {
  const supabase = await createClient();
  const [eventResult, rsvpsResult, currentMember] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle<EventRow>(),
    supabase
      .from("event_rsvps")
      .select("event_id, member_id, status")
      .eq("event_id", id)
      .returns<RsvpRow[]>(),
    getCurrentMember(),
  ]);
  throwOnSupabaseError(eventResult.error, "Unable to load the event");
  throwOnSupabaseError(rsvpsResult.error, "Unable to load event RSVPs");

  if (!eventResult.data) return null;
  return toEventItem(eventResult.data, rsvpsResult.data ?? [], currentMember?.id ?? null);
}
