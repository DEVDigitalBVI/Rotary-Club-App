"use server";

import { revalidatePath } from "next/cache";
import { parseClubRunnerCsv } from "@/lib/clubrunner-csv";
import { getCommittees } from "@/lib/data/committees";
import { getCurrentMember } from "@/lib/data/members";
import { canAddMembers } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export type ClubRunnerImportState =
  | { error: string; success?: never }
  | { error?: never; success: string }
  | undefined;

const MAX_CSV_BYTES = 1_000_000;
const MAX_ROWS = 500;

export async function importClubRunnerMembers(
  _previous: ClubRunnerImportState,
  formData: FormData
): Promise<ClubRunnerImportState> {
  const [member, committees] = await Promise.all([getCurrentMember(), getCommittees()]);
  if (!member || !canAddMembers(member, committees)) {
    return { error: "You do not have permission to import the club roster." };
  }

  const file = formData.get("roster");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a ClubRunner CSV export." };
  if (file.size > MAX_CSV_BYTES) return { error: "The CSV must be smaller than 1 MB." };

  const result = parseClubRunnerCsv(await file.text());
  if (result.errors.length > 0) return { error: result.errors.slice(0, 5).join(" ") };
  if (result.rows.length > MAX_ROWS) return { error: `Import no more than ${MAX_ROWS} members at a time.` };

  const supabase = await createClient();
  const emails = result.rows.map((row) => row.email);
  const [{ data: existing, error: lookupError }, superuserResult] = await Promise.all([
    supabase
      .from("members")
      .select("email, phone, classification, join_date, status")
      .returns<{ email: string; phone: string | null; classification: string | null; join_date: string | null; status: "active" | "inactive" | "honorary" }[]>(),
    supabase.rpc("is_superuser"),
  ]);
  if (lookupError) return { error: "The current roster could not be checked. Try again." };
  if (superuserResult.error) return { error: "The emergency-account guard could not be checked. Try again." };
  if (superuserResult.data && emails.includes(member.email.toLowerCase())) {
    return { error: "Remove the emergency account from the CSV before importing." };
  }

  const existingByEmail = new Map((existing ?? []).map((row) => [row.email.toLowerCase(), row]));
  const payload = result.rows.map((row) => {
    const current = existingByEmail.get(row.email);
    return {
      name: row.name,
      // Keep the stored casing when an older roster row predates email
      // normalization; Postgres's unique email constraint is case-sensitive.
      email: current?.email ?? row.email,
      phone: row.phone ?? current?.phone ?? null,
      classification: row.classification ?? current?.classification ?? null,
      join_date: row.joinDate ?? current?.join_date ?? null,
      // A CSV omission must never revoke access. Status changes remain an
      // explicit officer decision in the member profile.
      status: current?.status ?? "active",
    };
  });
  const { error } = await supabase.from("members").upsert(payload, { onConflict: "email" });
  if (error) return { error: "The roster was not changed. Check the file and your permissions, then try again." };

  const updated = emails.filter((email) => existingByEmail.has(email)).length;
  const added = emails.length - updated;
  revalidatePath("/directory");
  revalidatePath("/dashboard");
  return { success: `Roster updated: ${added} added and ${updated} refreshed. No members were removed.` };
}
