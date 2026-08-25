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
  detailedDescription: string | null;
  language: string;
  areaOfFocus: string | null;
  categories: string[];
  tags: string[];
  address: string | null;
  city: string | null;
  territory: string | null;
  country: string;
  communityAssessment: string | null;
  projectImpact: string | null;
  sustainabilityPlan: string | null;
  currency: string;
  estimatedBudget: number | null;
  amountPledged: number | null;
  cashContributions: number | null;
  inKindContributions: number | null;
  isRotaryGrant: boolean;
  grantType: string | null;
  grantNumber: string | null;
  grantAmount: number | null;
  collaborationNeeds: string[];
  partnerOrganizations: string[];
  projectContacts: string[];
  relatedLinks: string[];
  videoLinks: string[];
  coverImageUrl: string | null;
  beneficiariesReached: number | null;
  riProjectId: string | null;
  riProjectUrl: string | null;
  riUploadedAt: string | null;
};

type ProjectRow = {
  id: string; title: string; summary: string; location: string | null;
  starts_at: string; ends_at: string | null; volunteer_goal: number | null;
  hours_goal: number | null; status: ServiceProject["status"];
  detailed_description: string | null; language: string; area_of_focus: string | null;
  categories: string[]; tags: string[]; address: string | null; city: string | null;
  territory: string | null; country: string; community_assessment: string | null;
  project_impact: string | null; sustainability_plan: string | null; currency: string;
  estimated_budget: number | null; amount_pledged: number | null; cash_contributions: number | null;
  in_kind_contributions: number | null; is_rotary_grant: boolean; grant_type: string | null;
  grant_number: string | null; grant_amount: number | null; collaboration_needs: string[];
  partner_organizations: string[]; project_contacts: string[]; related_links: string[];
  video_links: string[]; cover_image_url: string | null; beneficiaries_reached: number | null;
  ri_project_id: string | null; ri_project_url: string | null; ri_uploaded_at: string | null;
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
    detailedDescription: project.detailed_description,
    language: project.language,
    areaOfFocus: project.area_of_focus,
    categories: project.categories ?? [],
    tags: project.tags ?? [],
    address: project.address,
    city: project.city,
    territory: project.territory,
    country: project.country,
    communityAssessment: project.community_assessment,
    projectImpact: project.project_impact,
    sustainabilityPlan: project.sustainability_plan,
    currency: project.currency,
    estimatedBudget: project.estimated_budget == null ? null : Number(project.estimated_budget),
    amountPledged: project.amount_pledged == null ? null : Number(project.amount_pledged),
    cashContributions: project.cash_contributions == null ? null : Number(project.cash_contributions),
    inKindContributions: project.in_kind_contributions == null ? null : Number(project.in_kind_contributions),
    isRotaryGrant: project.is_rotary_grant,
    grantType: project.grant_type,
    grantNumber: project.grant_number,
    grantAmount: project.grant_amount == null ? null : Number(project.grant_amount),
    collaborationNeeds: project.collaboration_needs ?? [],
    partnerOrganizations: project.partner_organizations ?? [],
    projectContacts: project.project_contacts ?? [],
    relatedLinks: project.related_links ?? [],
    videoLinks: project.video_links ?? [],
    coverImageUrl: project.cover_image_url,
    beneficiariesReached: project.beneficiaries_reached,
    riProjectId: project.ri_project_id,
    riProjectUrl: project.ri_project_url,
    riUploadedAt: project.ri_uploaded_at,
  }));
}
