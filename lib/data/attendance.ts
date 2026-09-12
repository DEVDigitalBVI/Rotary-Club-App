import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";

type MakeupRow = {
  id: string;
  member_id: string;
  attended_on: string;
  club_or_event: string;
  notes: string | null;
  clubrunner_logged: boolean;
  voided?: boolean;
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
  voided?: boolean;
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
    voided: row.voided ?? false,
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
