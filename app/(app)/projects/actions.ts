"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";

async function requireMember() {
  const member = await getCurrentMember();
  if (!member) throw new Error("You must be signed in.");
  return member;
}

export async function joinProjectAction(projectId: string) {
  const member = await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("project_volunteers").upsert({ project_id: projectId, member_id: member.id });
  if (error) throw new Error("Unable to join this project.", { cause: error });
  revalidatePath("/projects");
}

export async function leaveProjectAction(projectId: string) {
  const member = await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("project_volunteers").delete().eq("project_id", projectId).eq("member_id", member.id);
  if (error) throw new Error("Unable to leave this project.", { cause: error });
  revalidatePath("/projects");
}

export async function logVolunteerHoursAction(projectId: string, formData: FormData) {
  const member = await requireMember();
  const hours = Number(formData.get("hours"));
  const servedOn = String(formData.get("servedOn") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24 || !servedOn) throw new Error("Enter valid service hours and a date.");
  const supabase = await createClient();
  const { error } = await supabase.from("volunteer_hours").insert({ project_id: projectId, member_id: member.id, hours, served_on: servedOn, note: note || null });
  if (error) throw new Error("Unable to log volunteer hours.", { cause: error });
  revalidatePath("/projects");
}

export async function createProjectAction(formData: FormData) {
  const member = await requireMember();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "09:00");
  if (!title || !summary || !date) throw new Error("Title, summary, and date are required.");
  const startsAt = new Date(`${date}T${time}:00-04:00`);
  const supabase = await createClient();
  const { error } = await supabase.from("service_projects").insert({
    title, summary, starts_at: startsAt.toISOString(), location: String(formData.get("location") ?? "").trim() || null,
    volunteer_goal: Number(formData.get("volunteerGoal")) || null, hours_goal: Number(formData.get("hoursGoal")) || null,
    status: "open", created_by: member.id,
  });
  if (error) throw new Error("Unable to create the project.", { cause: error });
  revalidatePath("/projects");
}
