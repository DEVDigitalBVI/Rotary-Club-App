import { cache } from "react";
// Request-scoped deduplication only: never share member data across requests.
import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import type { Committee, CommitteeId } from "@/lib/club";

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
 * lib/club.ts's permission predicates (canPostNews, runsTheClub, etc.)
 * already expect — so that logic is reused unchanged against real data.
 */
export const getCommittees = cache(async function getCommittees(): Promise<Committee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("committees")
    .select("id, name, description, director_id, managed_by, committee_members(member_id)")
    .returns<CommitteeRow[]>();
  throwOnSupabaseError(error, "Unable to load committees");

  return (data ?? []).map((row) => ({
    id: row.id as CommitteeId,
    name: row.name,
    description: row.description ?? "",
    directorId: row.director_id ?? undefined,
    memberIds: row.committee_members.map((m) => m.member_id),
    managedBy: row.managed_by,
  }));
});
