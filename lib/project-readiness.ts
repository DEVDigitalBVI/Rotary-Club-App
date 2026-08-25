import type { ServiceProject } from "@/lib/data/projects";

const present = (value: unknown) => Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "" && value !== 0;

export function projectReadiness(project: ServiceProject) {
  const checks = [
    ["Area of focus", project.areaOfFocus], ["Detailed description", project.detailedDescription],
    ["Precise location", project.city || project.address], ["End date", project.endsAt],
    ["Community assessment", project.communityAssessment], ["Project impact", project.projectImpact],
    ["Sustainability", project.sustainabilityPlan], ["Budget or actual funding", project.estimatedBudget ?? project.cashContributions],
    ["Project contact", project.projectContacts], ["Partner or collaboration details", project.partnerOrganizations.length ? project.partnerOrganizations : project.collaborationNeeds],
    ["Engagement totals", project.volunteerIds.length || project.approvedHours], ["Photo, video, or related link", project.coverImageUrl || project.videoLinks.length || project.relatedLinks.length],
  ] as const;
  const complete = checks.filter(([, value]) => present(value)).length;
  return { percent: Math.round(complete / checks.length * 100), missing: checks.filter(([, value]) => !present(value)).map(([label]) => label) };
}
