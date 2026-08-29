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
  role?: "member" | "admin";
  position: "president" | "president-elect" | "secretary" | "secretary-elect" | "treasurer" | null;
  bio: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
  date_of_birth?: string | null;
  paul_harris_count: number;
  polio_plus_society: boolean;
  action_groups: string[];
};

const MEMBER_DIRECTORY_COLUMNS = [
  "id",
  "name",
  "email",
  "phone",
  "classification",
  "join_date",
  "status",
  "position",
  "bio",
  "avatar_color",
  "avatar_url",
  "paul_harris_count",
  "polio_plus_society",
  "action_groups",
].join(", ");

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
    role: row.role ?? "member",
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
  // A missing session is an expected signed-out state, not a data-layer
  // failure. Callers can redirect or render signed-out UI from the null.
  if (authError?.name !== "AuthSessionMissingError") {
    throwOnSupabaseError(authError, "Unable to verify the current user");
  }
  if (!user) return null;

  const { data: memberId, error: memberIdError } = await supabase.rpc("current_member_id");
  throwOnSupabaseError(memberIdError, "Unable to resolve the current member");
  if (!memberId) return null;

  const [{ data, error }, birthdayResult] = await Promise.all([
    supabase
    .from("members")
    .select(MEMBER_DIRECTORY_COLUMNS)
    .eq("id", memberId)
    .maybeSingle<MemberRow>(),
    supabase.rpc("get_member_birthday", { target_member_id: memberId }),
  ]);
  throwOnSupabaseError(error, "Unable to load the current member");
  throwOnSupabaseError(birthdayResult.error, "Unable to load the current member birthday");

  return data ? toMember({ ...data, date_of_birth: birthdayResult.data }) : null;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = await createClient();
  const [{ data, error }, birthdayResult] = await Promise.all([
    supabase
      .from("members")
      .select(MEMBER_DIRECTORY_COLUMNS)
      .eq("id", id)
      .maybeSingle<MemberRow>(),
    supabase.rpc("get_member_birthday", { target_member_id: id }),
  ]);
  throwOnSupabaseError(error, "Unable to load the member");
  throwOnSupabaseError(birthdayResult.error, "Unable to load the member birthday");

  return data ? toMember({ ...data, date_of_birth: birthdayResult.data }) : null;
}

export async function getMembers(): Promise<Member[]> {
  const supabase = await createClient();
  const [{ data, error }, birthdayResult, superuserResult, currentMemberResult] = await Promise.all([
    supabase
      .from("members")
      .select(MEMBER_DIRECTORY_COLUMNS)
      .order("name")
      .returns<MemberRow[]>(),
    supabase.rpc("get_member_birthdays"),
    supabase.rpc("is_superuser"),
    supabase.rpc("current_member_id"),
  ]);
  throwOnSupabaseError(error, "Unable to load members");
  throwOnSupabaseError(birthdayResult.error, "Unable to load member birthdays");
  throwOnSupabaseError(superuserResult.error, "Unable to apply directory visibility");
  throwOnSupabaseError(currentMemberResult.error, "Unable to resolve the current member");

  const birthdays = new Map(
    ((birthdayResult.data ?? []) as { member_id: string; birthday: string }[])
      .map((row) => [row.member_id, row.birthday])
  );

  const visibleRows = superuserResult.data
    ? (data ?? []).filter((row) => row.id !== currentMemberResult.data)
    : (data ?? []);

  return visibleRows.map((row) => toMember({
    ...row,
    date_of_birth: birthdays.get(row.id) ?? null,
  }));
}

/**
 * Members whose birthday is today, club-local. The club is small enough that
 * fetching everyone with a date on file and filtering here is simpler than a
 * date-part index, and matches how getMembers() already fetches the whole
 * roster.
 */
export async function getTodaysBirthdays(): Promise<Member[]> {
  const monthDay = todayMonthDay();
  return (await getMembers())
    .filter((member) => member.dateOfBirth?.slice(5) === monthDay);
}
