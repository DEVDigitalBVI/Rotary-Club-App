import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { todayDateString } from "@/lib/format";

const BYLAWS_THRESHOLD = 0.5;

function rotaryYearWindow(todayIso: string) {
  const [yearStr, monthStr] = todayIso.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const startYear = month >= 7 ? year : year - 1;
  return {
    startDate: `${startYear}-07-01`,
    endDate: `${startYear + 1}-07-01`,
    startInstant: `${startYear}-07-01T00:00:00-04:00`,
    endInstant: `${startYear + 1}-07-01T00:00:00-04:00`,
    label: `Jul ${startYear} – Jun ${startYear + 1}`,
  };
}

type MakeupRow = {
  id: string;
  member_id: string;
  attended_on: string;
  club_or_event: string;
  notes: string | null;
  clubrunner_logged: boolean;
  members?: { name: string } | null;
};

export type MakeupEntry = {
  id: string;
  memberId: string;
  memberName: string;
  attendedOn: string;
  clubOrEvent: string;
  notes: string | null;
  clubrunnerLogged: boolean;
};

export type AttendanceSummary = {
  meetingsHeld: number;
  meetingsAttended: number;
  makeupsCount: number;
  /** Fraction 0-1, or null when no meetings have been held yet this Rotary year. */
  percentage: number | null;
  meetsBylaws: boolean;
  rotaryYearLabel: string;
  makeups: MakeupEntry[];
};

function toMakeupEntry(row: MakeupRow): MakeupEntry {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.members?.name ?? "Member",
    attendedOn: row.attended_on,
    clubOrEvent: row.club_or_event,
    notes: row.notes,
    clubrunnerLogged: row.clubrunner_logged,
  };
}

export async function getMemberAttendanceSummary(memberId: string): Promise<AttendanceSummary> {
  const supabase = await createClient();
  const window = rotaryYearWindow(todayDateString());
  const now = new Date();

  const [meetingsResult, attendanceResult, makeupsResult] = await Promise.all([
      supabase
        .from("events")
        .select("id, starts_at")
        .eq("counts_toward_attendance", true)
        .not("attendance_taken_at", "is", null)
        .gte("starts_at", window.startInstant)
        .lt("starts_at", window.endInstant)
        .returns<{ id: string; starts_at: string }[]>(),
      supabase
        .from("event_attendance")
        .select("event_id")
        .eq("member_id", memberId)
        .returns<{ event_id: string }[]>(),
      supabase
        .from("makeups")
        .select("*, members!makeups_member_id_fkey(name)")
        .eq("member_id", memberId)
        .gte("attended_on", window.startDate)
        .lt("attended_on", window.endDate)
        .order("attended_on", { ascending: false })
        .returns<MakeupRow[]>(),
  ]);
  throwOnSupabaseError(meetingsResult.error, "Unable to load finalized meetings");
  throwOnSupabaseError(attendanceResult.error, "Unable to load member attendance");
  throwOnSupabaseError(makeupsResult.error, "Unable to load member makeups");

  const meetingRows = meetingsResult.data;
  const attendanceRows = attendanceResult.data;
  const makeupRows = makeupsResult.data;

  const heldIds = new Set(
    (meetingRows ?? []).filter((r) => new Date(r.starts_at) <= now).map((r) => r.id)
  );
  const meetingsHeld = heldIds.size;
  const attendedEventIds = new Set((attendanceRows ?? []).map((r) => r.event_id));
  const meetingsAttended = [...heldIds].filter((id) => attendedEventIds.has(id)).length;
  const makeups = (makeupRows ?? []).map(toMakeupEntry);
  const makeupsCount = makeups.length;

  const percentage =
    meetingsHeld === 0 ? null : Math.min(1, (meetingsAttended + makeupsCount) / meetingsHeld);

  return {
    meetingsHeld,
    meetingsAttended,
    makeupsCount,
    percentage,
    meetsBylaws: percentage === null ? true : percentage >= BYLAWS_THRESHOLD,
    rotaryYearLabel: window.label,
    makeups,
  };
}

/** Every makeup still needing manual entry into ClubRunner, across all members. */
export async function getPendingMakeups(): Promise<MakeupEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("makeups")
    .select("*, members!makeups_member_id_fkey(name)")
    .eq("clubrunner_logged", false)
    .order("attended_on", { ascending: false })
    .returns<MakeupRow[]>();
  throwOnSupabaseError(error, "Unable to load pending makeups");

  return (data ?? []).map(toMakeupEntry);
}

export async function getEventAttendance(eventId: string): Promise<{
  attendeeIds: string[];
  finalized: boolean;
}> {
  const supabase = await createClient();
  const [{ data, error }, { data: event, error: eventError }] = await Promise.all([
    supabase
      .from("event_attendance")
      .select("member_id")
      .eq("event_id", eventId)
      .returns<{ member_id: string }[]>(),
    supabase
      .from("events")
      .select("attendance_taken_at")
      .eq("id", eventId)
      .maybeSingle<{ attendance_taken_at: string | null }>(),
  ]);

  if (error) throw new Error("Unable to load event attendance", { cause: error });
  if (eventError) throw new Error("Unable to load attendance status", { cause: eventError });

  return {
    attendeeIds: (data ?? []).map((r) => r.member_id),
    finalized: event?.attendance_taken_at != null,
  };
}
