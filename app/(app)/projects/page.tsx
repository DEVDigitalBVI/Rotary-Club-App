import { getLedProjectIds } from "@/lib/data/project-slots";
import Link from "next/link";
import { CalendarDays, HandHeart, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getServiceProjects } from "@/lib/data/projects";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { committeeManageRight, canAssignRoles } from "@/lib/club";
import { PageContainer } from "@/components/page-container";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Tortola" }).format(new Date(value));
}

export default async function ProjectsPage() {
  const [projects, member, committees] = await Promise.all([getServiceProjects({ summary: true }), getCurrentMember(), getCommittees()]);
  const community = committees.find((committee) => committee.id === "community-service");
  const canManage = Boolean(member && community && committeeManageRight(member, community));
  const ledProjects = member ? await getLedProjectIds(member.id) : [];
  const visibleProjects = canManage ? projects : projects.filter((project) => project.status === "open" || project.status === "completed" || ledProjects.includes(project.id));

  return (
    <div>
      <PageHeader title="Service projects" description="Plan measurable service, mobilize members, and keep every project ready for Rotary International." actions={canManage && visibleProjects.length > 0 ? <ProjectFormDialog /> : undefined} />
      <PageContainer className="max-w-6xl space-y-6">
        <nav aria-label="Service project tools" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/projects/my-slots" className="text-sm font-semibold text-primary hover:underline">My upcoming service slots →</Link>
          {member && canAssignRoles(member) && <Link href="/projects/makeups" className="text-sm font-semibold text-primary hover:underline">Meeting makeups · ClubRunner entry →</Link>}
        </nav>
        {visibleProjects.length === 0 ? (
          <EmptyState icon={HandHeart} title="The next act of service starts here" description={canManage ? "Create a project when the club is ready to mobilize volunteers and measure its impact." : "No service projects are open right now. Check back for the club’s next opportunity to help."} action={canManage ? <ProjectFormDialog /> : undefined} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleProjects.map((project) => {
              const volunteerProgress = project.volunteerGoal ? Math.min(100, (project.volunteerCount ?? project.volunteerIds.length) / project.volunteerGoal * 100) : 0;
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
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-label text-[0.58rem] text-primary/60">{project.areaOfFocus ?? "Community service"}</p></div>
                    <h2 className="font-heading mt-2 text-3xl font-semibold leading-tight">{project.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.summary}</p>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      {project.startsAt && <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{dateLabel(project.startsAt)}</span>}
                      {(project.location || project.city) && <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{[project.location, project.city].filter(Boolean).join(", ")}</span>}
                    </div>
                    {project.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{project.tags.map((tag) => <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] text-muted-foreground">#{tag}</span>)}</div>}
                  </div>
                  <div className="space-y-5 p-6">
                    <Progress value={volunteerProgress}><span className="flex items-center gap-1.5 text-xs font-bold"><Users className="size-3.5" />{(project.volunteerCount ?? project.volunteerIds.length)}{project.volunteerGoal ? ` of ${project.volunteerGoal}` : ""} volunteers</span></Progress>
                    <div className="flex flex-wrap gap-2">
                      <Button nativeButton={false} render={<Link href={`/projects/${project.id}`} />}>{project.status === "open" ? "Choose a time slot" : "View slots & attendance"}</Button>
                      <Link href={`/projects/${project.id}`} className="inline-flex items-center text-sm font-semibold text-primary">{canManage ? "Manage project & RI report" : "View impact"}</Link>
                    </div>
                    {project.approvedHours > 0 && <p className="text-xs text-muted-foreground">{project.approvedHours} service hours contributed.</p>}
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
