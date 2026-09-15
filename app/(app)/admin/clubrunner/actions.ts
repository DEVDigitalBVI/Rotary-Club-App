"use server";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { parseClubRunnerCsv } from "@/lib/clubrunner-csv";
import { planRosterImport, type RosterRow } from "@/lib/roster-import";
import { getCommittees } from "@/lib/data/committees";
import { getCurrentMember } from "@/lib/data/members";
import { canAddMembers } from "@/lib/club";
import { createClient } from "@/lib/supabase/server";
export type ClubRunnerImportState = { error?: string; success?: string } | undefined;

async function prepareImport(formData: FormData) {
  const [member, committees] = await Promise.all([getCurrentMember(), getCommittees()]);
  if (!member || !canAddMembers(member, committees)) throw new Error("You do not have permission to import the club roster.");
  const file = formData.get("roster");
  if (!(file instanceof File) || !file.size || file.size > 1_000_000) throw new Error("Choose a CSV smaller than 1 MB.");
  const parsed = parseClubRunnerCsv(await file.text());
  if (parsed.errors.length) throw new Error(parsed.errors.slice(0, 5).join(" "));
  if (!parsed.rows.length || parsed.rows.length > 500) throw new Error("Choose between 1 and 500 members.");
  const db = await createClient();
  const guard = await db.rpc("is_superuser");
  if (guard.error) throw new Error("The emergency-account guard could not be checked.");
  if (guard.data && parsed.rows.some(row => row.email === member.email.toLowerCase())) throw new Error("Remove the emergency account from the CSV before importing.");
  const existing: RosterRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await db.from("members").select("name,email,phone,classification,join_date,status").order("id").range(offset, offset + 499).returns<RosterRow[]>();
    if (result.error) throw new Error("The roster could not be checked. Please try again.");
    existing.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 500) break;
  }
  const plan = planRosterImport(parsed.rows, existing);
  const fingerprint = createHash("sha256").update(JSON.stringify(plan)).digest("hex");
  return { db, plan, fingerprint };
}

export async function previewClubRunnerImport(formData: FormData) {
  try { const { plan, fingerprint } = await prepareImport(formData); return { plan, fingerprint }; }
  catch (error) { return { error: error instanceof Error ? error.message : "Unable to preview this import." }; }
}

export async function importClubRunnerMembers(_previous: ClubRunnerImportState, formData: FormData): Promise<ClubRunnerImportState> {
  try {
    const { db, plan, fingerprint } = await prepareImport(formData);
    if (formData.get("fingerprint") !== fingerprint) return { error: "The file or roster changed. Choose the file again to review an updated preview." };
    const payload = plan.filter(row => row.kind !== "unchanged").map(row => row.after);
    if (payload.length) {
      const { error } = await db.from("members").upsert(payload, { onConflict: "email" });
      if (error) return { error: "The roster was not updated. Check the file and your permissions, then try again." };
    }
    revalidatePath("/directory"); revalidatePath("/dashboard");
    return { success: `${plan.filter(row => row.kind === "added").length} added, ${plan.filter(row => row.kind === "changed").length} changed, ${plan.filter(row => row.kind === "unchanged").length} unchanged. No members removed.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to import this roster." }; }
}
