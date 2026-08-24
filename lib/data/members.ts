import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { initialsFromName, todayMonthDay } from "@/lib/format";
import type { Member } from "@/lib/mock-data";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  classification: string | null;
  join_date: string | null;
  status: "active" | "inactive" | "honorary";
  role: "member" | "admin";
  position: "president" | "president-elect" | "secretary" | "secretary-elect" | "treasurer" | null;
  bio: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  paul_harris_count: number;
  polio_plus_society: boolean;
  action_groups: string[];
};

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    initials: initialsFromName(row.name),
    email: row.email,
    phone: row.phone ?? "",
    classification: row.classification ?? "",
    joinDate: row.join_date ?? "",
    status: row.status,
    role: row.role,
    position: row.position ?? undefined,
    bio: row.bio ?? undefined,
    avatarColor: row.avatar_color ?? "var(--rotary-blue)",
    avatarUrl: row.avatar_url ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    foundation: {
      paulHarrisCount: row.paul_harris_count,
      polioPlusSociety: row.polio_plus_society,
      actionGroups: row.action_groups,
    },
  };
}

/** The signed-in member's own row, or null if not linked to one yet. */
export async function getCurrentMember(): Promise<Member | null> {
  const supabase = await createClient();
  const {
    data: { user }, error: authError,
  } = await supabase.auth.getUser();
  throwOnSupabaseError(authError, "Unable to verify the current user");
  if (!user) return null;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<MemberRow>();
  throwOnSupabaseError(error, "Unable to load the current member");

  return data ? toMember(data) : null;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle<MemberRow>();
  throwOnSupabaseError(error, "Unable to load the member");

  return data ? toMember(data) : null;
}

export async function getMembers(): Promise<Member[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("name")
    .returns<MemberRow[]>();
  throwOnSupabaseError(error, "Unable to load members");

  return (data ?? []).map(toMember);
}

/**
 * Members whose birthday is today, club-local. The club is small enough that
 * fetching everyone with a date on file and filtering here is simpler than a
 * date-part index, and matches how getMembers() already fetches the whole
 * roster.
 */
export async function getTodaysBirthdays(): Promise<Member[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .not("date_of_birth", "is", null)
    .order("name")
    .returns<MemberRow[]>();
  throwOnSupabaseError(error, "Unable to load member birthdays");

  const monthDay = todayMonthDay();
  return (data ?? [])
    .filter((row) => row.date_of_birth!.slice(5) === monthDay)
    .map(toMember);
}
