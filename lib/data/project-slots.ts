import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";

export type ProjectSlot = { id: string; project_id: string; title: string; starts_at: string; ends_at: string; signup_closes_at: string; capacity: number; location: string | null; cancelled: boolean; revision: number; registered: number; waitlisted: number };
export type SlotSignup = { slot_id: string; member_id: string; status: "registered" | "waitlisted"; attendance: "present" | "absent" | "excused" | null; credited_hours: number; recorded_by: string | null; recorded_at: string | null };
export type ProjectLeader = { member_id: string; role: "lead" | "deputy" };
export type AttendanceAudit = { id: number; slot_id: string; member_id: string; actor_id: string; changed_at: string; previous_state: SlotSignup | null; next_state: SlotSignup };

export async function getProjectSlots(projectId: string) {
  const db = await createClient();
  const [slots, leaders, permissions, counts, project] = await Promise.all([
    db.from("project_slots").select("*").eq("project_id", projectId).order("starts_at").returns<ProjectSlot[]>(),
    db.from("project_leaders").select("member_id, role").eq("project_id", projectId).returns<ProjectLeader[]>(),
    db.rpc("project_permissions", { p_project: projectId }),
    db.rpc("project_slot_counts", { p_project: projectId }),
    db.from("service_projects").select("committee_id").eq("id", projectId).single<{ committee_id: string }>(),
  ]);
  for (const result of [slots, leaders, permissions, counts, project]) throwOnSupabaseError(result.error, "Unable to load project slots");
  const slotIds = (slots.data ?? []).map((s) => s.id);
  const access = permissions.data as { canManage: boolean; canAssign: boolean };
  const [signups, audit] = slotIds.length ? await Promise.all([
    db.from("project_slot_signups").select("*").in("slot_id", slotIds).returns<SlotSignup[]>(),
    access.canManage ? db.from("project_attendance_audit").select("*").in("slot_id", slotIds).order("changed_at", { ascending: false }).limit(30).returns<AttendanceAudit[]>() : { data: [], error: null },
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  throwOnSupabaseError(signups.error, "Unable to load the slot roster");
  throwOnSupabaseError(audit.error, "Unable to load attendance history");
  const totals = (counts.data ?? []) as { slot_id: string; registered: number; waitlisted: number }[];
  return { slots: (slots.data ?? []).map((s) => ({ ...s, registered: Number(totals.find((c) => c.slot_id === s.id)?.registered ?? 0), waitlisted: Number(totals.find((c) => c.slot_id === s.id)?.waitlisted ?? 0) })), leaders: leaders.data ?? [], signups: signups.data ?? [], audit: audit.data ?? [], committeeId: project.data!.committee_id, ...access };
}

export async function getMyProjectSlots(memberId: string) {
  const db = await createClient();
  const { data, error } = await db.from("project_slot_signups")
    .select("slot_id, status, attendance, credited_hours, project_slots!inner(id, title, starts_at, ends_at, cancelled, project_id, service_projects!inner(title))")
    .eq("member_id", memberId).eq("project_slots.cancelled", false)
    .eq("project_slots.service_projects.status", "open")
    .gte("project_slots.ends_at", new Date().toISOString());
  if (error && ["PGRST205", "42P01"].includes(error.code)) return [];
  throwOnSupabaseError(error, "Unable to load your service slots");
  return (data ?? []) as unknown as { slot_id: string; status: string; attendance: string | null; credited_hours: number; project_slots: { id: string; title: string; starts_at: string; ends_at: string; project_id: string; service_projects: { title: string } } }[];
}

export async function isProjectSlotWorkflowReady() {
  const db = await createClient();
  const { error } = await db.from("project_slots").select("id").limit(0);
  if (error && ["PGRST205", "42P01"].includes(error.code)) return false;
  throwOnSupabaseError(error, "Unable to check project scheduling");
  return true;
}

export async function getLedProjectIds(memberId: string) {
  const db = await createClient();
  const { data, error } = await db.from("project_leaders").select("project_id").eq("member_id", memberId);
  if (error && ["PGRST205", "42P01"].includes(error.code)) return [];
  throwOnSupabaseError(error, "Unable to load your project responsibilities");
  return (data ?? []).map((row) => row.project_id as string);
}
