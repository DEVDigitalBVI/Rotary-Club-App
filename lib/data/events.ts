import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { getCurrentMember } from "@/lib/data/members";
import { formatTime, toClubDateString, todayDateString } from "@/lib/format";
import type { EventItem } from "@/lib/club";

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
  capacity: number | null;
  allow_guests: boolean;
  waitlist_enabled: boolean;
  dietary_notes_enabled: boolean;
};

type RsvpRow = { event_id: string; member_id: string; status: "yes" | "no" | "maybe"; guest_count: number; dietary_notes: string | null; registration_status: "registered" | "waitlisted" };

function toEventItem(
  row: EventRow,
  rsvps: RsvpRow[],
  currentMemberId: string | null
): EventItem & { startsAt: string } {
  const own = currentMemberId ? rsvps.find((r) => r.member_id === currentMemberId) : undefined;
  const confirmed = rsvps.filter((r) => r.status === "yes" && r.registration_status === "registered");
  const counts = { yes: confirmed.length, no: 0, maybe: 0 };
  for (const r of rsvps) {
    if (r.status !== "yes") counts[r.status]++;
  }
  const waitlisted = rsvps.filter((r) => r.status === "yes" && r.registration_status === "waitlisted").length;
  const guests = confirmed
    .reduce((total, rsvp) => total + Number(rsvp.guest_count), 0);

  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
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
    rsvps: { ...counts, guests, waitlisted },
    myRsvp: own?.status ?? "none",
    registration: own ? { guestCount: own.guest_count, dietaryNotes: own.dietary_notes ?? "", status: own.registration_status } : undefined,
    capacity: row.capacity ?? undefined,
    allowGuests: row.allow_guests,
    waitlistEnabled: row.waitlist_enabled,
    dietaryNotesEnabled: row.dietary_notes_enabled,
    attendance:
      row.attendance_present != null && row.attendance_total != null
        ? { present: row.attendance_present, total: row.attendance_total }
        : undefined,
    // Only registered members are confirmed; waitlisted RSVPs have no seat.
    attendeeIds: confirmed.map((r) => r.member_id),
    attendeeGuestCounts: Object.fromEntries(
      confirmed
        .filter((r) => Number(r.guest_count) > 0)
        .map((r) => [r.member_id, Number(r.guest_count)])
    ),
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

export async function getEvents(): Promise<(EventItem & { startsAt: string })[]> {
  const supabase = await createClient();
  const [eventsResult, rsvpsResult, currentMember] = await Promise.all([
    supabase.from("events").select("*").order("starts_at").returns<EventRow[]>(),
    supabase.rpc("get_visible_event_rsvps", { target_event_id: null }).overrideTypes<RsvpRow[], { merge: false }>(),
    getCurrentMember(),
  ]);
  throwOnSupabaseError(eventsResult.error, "Unable to load events");
  throwOnSupabaseError(rsvpsResult.error, "Unable to load event RSVPs");

  const rsvpsByEvent = groupByEvent((rsvpsResult.data ?? []) as unknown as RsvpRow[]);
  return (eventsResult.data ?? []).map((row) =>
    toEventItem(row, rsvpsByEvent.get(row.id) ?? [], currentMember?.id ?? null)
  );
}

export async function getEventById(id: string): Promise<EventItem | null> {
  const supabase = await createClient();
  const [eventResult, rsvpsResult, currentMember] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle<EventRow>(),
    supabase.rpc("get_visible_event_rsvps", { target_event_id: id }).overrideTypes<RsvpRow[], { merge: false }>(),
    getCurrentMember(),
  ]);
  throwOnSupabaseError(eventResult.error, "Unable to load the event");
  throwOnSupabaseError(rsvpsResult.error, "Unable to load event RSVPs");

  if (!eventResult.data) return null;
  return toEventItem(eventResult.data, (rsvpsResult.data ?? []) as unknown as RsvpRow[], currentMember?.id ?? null);
}

/** Summary rows keep guest dietary notes and attendee lists out of list payloads. */
export async function getEventPage(period: "upcoming" | "past" = "upcoming", page = 1, size = 12) {
  const db = await createClient();
  const boundary = `${todayDateString()}T00:00:00-04:00`;
  let query = db.from("events").select("*", { count: "exact" });
  query = period === "past" ? query.lt("starts_at", boundary) : query.gte("starts_at", boundary);
  const result = await query.order("starts_at", { ascending: period === "upcoming" }).order("id").range((page - 1) * size, page * size - 1).returns<EventRow[]>();
  throwOnSupabaseError(result.error, "Unable to load events");
  const rows = result.data ?? [];
  const summaries = rows.length ? await db.rpc("event_card_summaries", { p_ids: rows.map(row => row.id) }) : { data: [], error: null };
  throwOnSupabaseError(summaries.error, "Unable to load event registrations");
  type Summary = { event_id: string; yes_count: number; no_count: number; maybe_count: number; guest_count: number; waitlisted_count: number; own_status: EventItem["myRsvp"] | null };
  const byId = new Map(((summaries.data ?? []) as Summary[]).map(row => [row.event_id, row]));
  return { total: result.count ?? 0, events: rows.map(row => {
    const summary = byId.get(row.id);
    return { ...toEventItem(row, [], null), myRsvp: summary?.own_status ?? "none", rsvps: { yes: Number(summary?.yes_count ?? 0), no: Number(summary?.no_count ?? 0), maybe: Number(summary?.maybe_count ?? 0), guests: Number(summary?.guest_count ?? 0), waitlisted: Number(summary?.waitlisted_count ?? 0) } };
  }) };
}
