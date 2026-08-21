import { createClient } from "@/lib/supabase/server";
import type { Committee, CommitteeId } from "@/lib/mock-data";

type CommitteeRow = {
  id: string;
  name: string;
  description: string | null;
  director_id: string | null;
  managed_by: "director" | "officers";
  committee_members: { member_id: string }[];
};

/**
 * Assembles committees with their rosters, in the same shape
 * lib/mock-data.ts's permission predicates (canPostNews, runsTheClub, etc.)
 * already expect — so that logic is reused unchanged against real data.
 */
export async function getCommittees(): Promise<Committee[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("committees")
    .select("id, name, description, director_id, managed_by, committee_members(member_id)")
    .returns<CommitteeRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id as CommitteeId,
    name: row.name,
    description: row.description ?? "",
    directorId: row.director_id ?? undefined,
    memberIds: row.committee_members.map((m) => m.member_id),
    managedBy: row.managed_by,
  }));
}
