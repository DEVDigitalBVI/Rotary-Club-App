import { CalendarDays, Clock3, HandHeart, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getServiceProjects } from "@/lib/data/projects";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { committeeManageRight } from "@/lib/mock-data";
import { deleteProjectAction, joinProjectAction, leaveProjectAction, logVolunteerHoursAction } from "./actions";
import { PageContainer } from "@/components/page-container";
import { DeleteRecordButton } from "@/components/delete-record-button";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { RiProjectSummary } from "@/components/projects/ri-project-summary";
import { projectReadiness } from "@/lib/project-readiness";
import { ProjectImpactDialog } from "@/components/projects/project-impact-dialog";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Tortola" }).format(new Date(value));
}

export default async function ProjectsPage() {
  const [projects, member, committees] = await Promise.all([getServiceProjects(), getCurrentMember(), getCommittees()]);
  const community = committees.find((committee) => committee.id === "community-service");
  const canManage = Boolean(member && community && committeeManageRight(member, community));
  const visibleProjects = canManage ? projects : projects.filter((project) => project.status === "open" || project.status === "completed");

  return (
    <div>
      <PageHeader title="Service projects" description="Plan measurable service, mobilize members, and keep every project ready for Rotary International." actions={canManage ? <ProjectFormDialog /> : undefined} />
      <PageContainer className="max-w-6xl space-y-6">
        {visibleProjects.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border p-12 text-center"><HandHeart className="mx-auto size-9 text-primary" /><h2 className="font-heading mt-4 text-2xl font-semibold">The next act of service starts here.</h2><p className="mt-2 text-sm text-muted-foreground">No projects are open yet.</p></div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleProjects.map((project) => {
              const joined = Boolean(member && project.volunteerIds.includes(member.id));
              const volunteerProgress = project.volunteerGoal ? Math.min(100, project.volunteerIds.length / project.volunteerGoal * 100) : 0;
              const readiness = projectReadiness(project);
              return (
                <article key={project.id} className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
                  {project.coverImageUrl && (
                    <div className="aspect-[16/7] overflow-hidden border-b border-border bg-muted">
                      {/* External project evidence can come from partner sites
                          whose image hosts are not known at build time. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={project.coverImageUrl} alt="" className="size-full object-cover" />
                    </div>
                  )}
                  <div className="border-b border-border p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-label text-[0.58rem] text-primary/60">{project.areaOfFocus ?? "Community service"}</p>{canManage && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold text-primary">RI {readiness.percent}% ready</span>}</div>
                    <h2 className="font-heading mt-2 text-3xl font-semibold leading-tight">{project.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.summary}</p>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      {project.startsAt && <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{dateLabel(project.startsAt)}</span>}
                      {(project.location || project.city) && <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{[project.location, project.city].filter(Boolean).join(", ")}</span>}
                    </div>
                    {project.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{project.tags.map((tag) => <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-muted-foreground">#{tag}</span>)}</div>}
                  </div>
                  <div className="space-y-5 p-6">
                    <Progress value={volunteerProgress}><span className="flex items-center gap-1.5 text-xs font-bold"><Users className="size-3.5" />{project.volunteerIds.length}{project.volunteerGoal ? ` of ${project.volunteerGoal}` : ""} volunteers</span></Progress>
                    <div className="flex flex-wrap gap-2">
                      <form action={joined ? leaveProjectAction.bind(null, project.id) : joinProjectAction.bind(null, project.id)}><Button type="submit" variant={joined ? "outline" : "default"} className="rounded-full">{joined ? "Leave project" : "I’ll volunteer"}</Button></form>
                      <ProjectImpactDialog project={project} />
                      {canManage && (
                        <div className="ml-auto flex flex-wrap gap-2"><ProjectFormDialog project={project} /><RiProjectSummary project={project} /><DeleteRecordButton label="Delete" title={`Delete ${project.title}?`} description="This permanently removes the project, its volunteer roster, and all logged hours. This cannot be undone." deleteAction={deleteProjectAction.bind(null, project.id)} className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" /></div>
                      )}
                    </div>
                    {joined && (
                      <form action={logVolunteerHoursAction.bind(null, project.id)} className="grid gap-2 border-t border-border pt-5 sm:grid-cols-[1fr_1fr_auto]">
                        <Input name="servedOn" type="date" required aria-label="Date served" />
                        <Input name="hours" type="number" min="0.25" max="24" step="0.25" placeholder="Hours" required aria-label="Hours served" />
                        <Button type="submit" variant="secondary"><Clock3 className="size-4" />Log hours</Button>
                      </form>
                    )}
                    {project.approvedHours > 0 && <p className="text-xs text-muted-foreground">{project.approvedHours} approved service hours contributed.</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
