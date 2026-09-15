import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectImpactDialog } from "@/components/projects/project-impact-dialog";
import { RiProjectSummary } from "@/components/projects/ri-project-summary";
import { DeleteRecordButton } from "@/components/delete-record-button";
import { deleteProjectAction } from "../actions";
import { committeeManageRight } from "@/lib/club";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServiceProjectById } from "@/lib/data/projects";
import { getCurrentMember, getMemberSummaries } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { getProjectSlots, isProjectSlotWorkflowReady } from "@/lib/data/project-slots";
import { ProjectSlots } from "@/components/projects/project-slots";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, member] = await Promise.all([getServiceProjectById(id), getCurrentMember()]);
  if (!member) redirect("/login");
  if (!project) notFound();
  if (!await isProjectSlotWorkflowReady()) return <div><PageHeader title={project.title} description={project.summary} /><PageContainer><p className="rounded-xl border border-border p-5">Time-slot scheduling is being set up. Please check back shortly.</p></PageContainer></div>;
  const [workflow, members, committees] = await Promise.all([getProjectSlots(id), getMemberSummaries(), getCommittees()]);
  if (["draft", "cancelled"].includes(project.status) && !workflow.canManage) notFound();
  const community = committees.find(committee => committee.id === "community-service");
  const canEdit = Boolean(community && committeeManageRight(member, community));
  return <div><PageHeader title={project.title} description={project.summary} /><PageContainer className="max-w-6xl"><Link href="/projects" className="text-sm font-semibold text-primary hover:underline">← All service projects</Link><div className="my-5 flex flex-wrap gap-3"><ProjectImpactDialog project={project}/>{canEdit && <><ProjectFormDialog project={project}/><RiProjectSummary project={project}/><DeleteRecordButton label="Delete project" title={`Delete ${project.title}?`} description="This permanently removes the project, its volunteer roster, and logged hours." deleteAction={deleteProjectAction.bind(null, project.id)}/></>}</div><ProjectSlots key={`${id}-${JSON.stringify(workflow)}`} serverNow={new Date().toISOString()} project={project} member={member} members={members} committees={committees} workflow={workflow} /></PageContainer></div>;
}
