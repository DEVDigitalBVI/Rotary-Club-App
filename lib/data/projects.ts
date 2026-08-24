import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";

export type ServiceProject = {
  id: string;
  title: string;
  summary: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  volunteerGoal: number | null;
  hoursGoal: number | null;
  status: "draft" | "open" | "completed" | "cancelled";
  volunteerIds: string[];
  approvedHours: number;
};

type ProjectRow = {
  id: string; title: string; summary: string; location: string | null;
  starts_at: string; ends_at: string | null; volunteer_goal: number | null;
  hours_goal: number | null; status: ServiceProject["status"];
};

export async function getServiceProjects(): Promise<ServiceProject[]> {
  const supabase = await createClient();
  const [projectsResult, volunteersResult, hoursResult] = await Promise.all([
    supabase.from("service_projects").select("*").order("starts_at").returns<ProjectRow[]>(),
    supabase.from("project_volunteers").select("project_id, member_id").returns<{ project_id: string; member_id: string }[]>(),
    supabase.from("volunteer_hours").select("project_id, hours").not("approved_at", "is", null).returns<{ project_id: string; hours: number }[]>(),
  ]);
  throwOnSupabaseError(projectsResult.error, "Unable to load service projects");
  throwOnSupabaseError(volunteersResult.error, "Unable to load project volunteers");
  throwOnSupabaseError(hoursResult.error, "Unable to load volunteer hours");

  return (projectsResult.data ?? []).map((project) => ({
    id: project.id,
    title: project.title,
    summary: project.summary,
    location: project.location,
    startsAt: project.starts_at,
    endsAt: project.ends_at,
    volunteerGoal: project.volunteer_goal,
    hoursGoal: project.hours_goal == null ? null : Number(project.hours_goal),
    status: project.status,
    volunteerIds: (volunteersResult.data ?? []).filter((row) => row.project_id === project.id).map((row) => row.member_id),
    approvedHours: (hoursResult.data ?? []).filter((row) => row.project_id === project.id).reduce((sum, row) => sum + Number(row.hours), 0),
  }));
}
