import { createClient } from "@/lib/supabase/server";
import { initialsFromName } from "@/lib/format";
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
  position: "president" | "president-elect" | "secretary" | "treasurer" | null;
  bio: string | null;
  avatar_color: string | null;
  avatar_url: string | null;
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
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<MemberRow>();

  return data ? toMember(data) : null;
}

export async function getMembers(): Promise<Member[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .order("name")
    .returns<MemberRow[]>();

  return (data ?? []).map(toMember);
}
