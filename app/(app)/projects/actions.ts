"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";

export type ProjectFormState = { error?: string; success?: boolean } | undefined;

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

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim() || null;
const number = (formData: FormData, key: string) => {
  const value = text(formData, key);
  return value == null ? null : Number(value);
};
const lines = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").split("\n").map((value) => value.trim()).filter(Boolean);

function projectValues(formData: FormData) {
  const date = text(formData, "date");
  const time = text(formData, "time") ?? "09:00";
  const endDate = text(formData, "endDate");
  const endTime = text(formData, "endTime") ?? time;
  return {
    title: text(formData, "title"),
    summary: text(formData, "summary"),
    detailed_description: text(formData, "detailedDescription"),
    starts_at: date ? new Date(`${date}T${time}:00-04:00`).toISOString() : null,
    ends_at: endDate ? new Date(`${endDate}T${endTime}:00-04:00`).toISOString() : null,
    location: text(formData, "location"),
    address: text(formData, "address"), city: text(formData, "city"),
    territory: text(formData, "territory"), country: text(formData, "country") ?? "British Virgin Islands",
    language: text(formData, "language") ?? "English",
    area_of_focus: text(formData, "areaOfFocus"),
    categories: lines(formData, "categories"), tags: lines(formData, "tags"),
    status: text(formData, "status") ?? "open",
    volunteer_goal: number(formData, "volunteerGoal"), hours_goal: number(formData, "hoursGoal"),
    community_assessment: text(formData, "communityAssessment"),
    project_impact: text(formData, "projectImpact"), sustainability_plan: text(formData, "sustainabilityPlan"),
    currency: (text(formData, "currency") ?? "USD").toUpperCase(),
    estimated_budget: number(formData, "estimatedBudget"), amount_pledged: number(formData, "amountPledged"),
    cash_contributions: number(formData, "cashContributions"), in_kind_contributions: number(formData, "inKindContributions"),
    is_rotary_grant: formData.get("isRotaryGrant") === "on", grant_type: text(formData, "grantType"),
    grant_number: text(formData, "grantNumber"), grant_amount: number(formData, "grantAmount"),
    collaboration_needs: lines(formData, "collaborationNeeds"), partner_organizations: lines(formData, "partnerOrganizations"),
    project_contacts: lines(formData, "projectContacts"), related_links: lines(formData, "relatedLinks"),
    video_links: lines(formData, "videoLinks"), cover_image_url: text(formData, "coverImageUrl"),
    beneficiaries_reached: number(formData, "beneficiariesReached"), ri_project_id: text(formData, "riProjectId"),
    ri_project_url: text(formData, "riProjectUrl"), ri_uploaded_at: text(formData, "riUploadedAt"),
  };
}

export async function createProjectAction(_state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const member = await requireMember();
  const values = projectValues(formData);
  if (!values.title || !values.summary || !values.starts_at) return { error: "Title, summary, and start date are required." };
  const supabase = await createClient();
  const { error } = await supabase.from("service_projects").insert({
    ...values, created_by: member.id,
  });
  if (error) return { error: "Unable to create the project — check the details or your permissions." };
  revalidatePath("/projects");
  return { success: true };
}

export async function updateProjectAction(projectId: string, _state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  await requireMember();
  const values = projectValues(formData);
  if (!values.title || !values.summary || !values.starts_at) return { error: "Title, summary, and start date are required." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_projects").update(values).eq("id", projectId).select("id").maybeSingle();
  if (error || !data) return { error: "Unable to save this project — you may not have permission." };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProjectAction(projectId: string) {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_projects")
    .delete()
    .eq("id", projectId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Unable to delete this project — you may not have permission." };
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}
