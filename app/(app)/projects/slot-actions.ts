"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SlotResult = { error?: string; success?: string };
async function run(name: string, args: Record<string, unknown>): Promise<SlotResult> {
  const db = await createClient();
  const { error, data } = await db.rpc(name, args);
  if (error) return { error: error.code === "P0001" ? error.message : "Unable to save. Check the details and try again." };
  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/account");
  return { success: typeof data === "string" && ["registered", "waitlisted", "cancelled"].includes(data) ? `You are ${data}.` : "Saved." };
}
export async function assignProjectTeam(projectId: string, form: FormData) {
  return run("assign_project_team", { p_project: projectId, p_committee: String(form.get("committee")), p_lead: String(form.get("lead") ?? "") || null, p_deputy: String(form.get("deputy") ?? "") || null });
}
export async function saveProjectSlot(projectId: string, slotId: string | null, form: FormData): Promise<SlotResult> {
  const start = new Date(`${form.get("date")}T${form.get("start")}:00-04:00`);
  const end = new Date(`${form.get("date")}T${form.get("end")}:00-04:00`);
  const cutoff = form.get("cutoff") ? new Date(`${form.get("cutoff")}:00-04:00`) : start;
  if ([start, end, cutoff].some((value) => Number.isNaN(value.getTime())) || end <= start) return { error: "Enter valid times; the end must be after the start." };
  return run("save_project_slot", { p_project: projectId, p_slot: slotId, p_title: String(form.get("title") ?? ""), p_start: start.toISOString(), p_end: end.toISOString(), p_cutoff: cutoff.toISOString(), p_capacity: Number(form.get("capacity")), p_location: String(form.get("location") ?? "") });
}
export async function changeProjectSignup(slotId: string, cancel = false, previous: string | null = null) {
  return run("change_project_signup", { p_slot: slotId, p_cancel: cancel, p_previous: previous });
}
export async function cancelProjectSlot(slotId: string) { return run("cancel_project_slot", { p_slot: slotId }); }
export async function recordProjectAttendance(slotId: string, revision: number, records: { member_id: string; attendance: string; hours: number | null }[]) {
  return run("record_project_attendance", { p_slot: slotId, p_revision: revision, p_records: records });
}
