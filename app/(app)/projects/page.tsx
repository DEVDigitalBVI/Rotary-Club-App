import { CalendarDays, Clock3, HandHeart, MapPin, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { getServiceProjects } from "@/lib/data/projects";
import { getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { committeeManageRight } from "@/lib/mock-data";
import { createProjectAction, joinProjectAction, leaveProjectAction, logVolunteerHoursAction } from "./actions";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Tortola" }).format(new Date(value));
}

export default async function ProjectsPage() {
  const [projects, member, committees] = await Promise.all([getServiceProjects(), getCurrentMember(), getCommittees()]);
  const community = committees.find((committee) => committee.id === "community-service");
  const canManage = Boolean(member && community && committeeManageRight(member, community));

  return (
    <div>
      <PageHeader title="Service projects" description="Put your time and talents to work across the BVI." />
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
        {canManage && (
          <details className="rounded-2xl border border-border bg-card p-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-primary"><Plus className="size-4" />Create a service project</summary>
            <form action={createProjectAction} className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input name="title" placeholder="Project title" required className="h-11" />
              <Input name="location" placeholder="Location" className="h-11" />
              <Textarea name="summary" placeholder="What will volunteers accomplish?" required className="sm:col-span-2" />
              <Input name="date" type="date" required className="h-11" />
              <Input name="time" type="time" defaultValue="09:00" required className="h-11" />
              <Input name="volunteerGoal" type="number" min="1" placeholder="Volunteer goal" className="h-11" />
              <Input name="hoursGoal" type="number" min="1" step="0.5" placeholder="Hours goal" className="h-11" />
              <Button type="submit" className="h-11 rounded-full sm:col-span-2">Publish project</Button>
            </form>
          </details>
        )}

        {projects.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border p-12 text-center"><HandHeart className="mx-auto size-9 text-primary" /><h2 className="font-heading mt-4 text-2xl font-semibold">The next act of service starts here.</h2><p className="mt-2 text-sm text-muted-foreground">No projects are open yet.</p></div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {projects.map((project) => {
              const joined = Boolean(member && project.volunteerIds.includes(member.id));
              const volunteerProgress = project.volunteerGoal ? Math.min(100, project.volunteerIds.length / project.volunteerGoal * 100) : 0;
              return (
                <article key={project.id} className="overflow-hidden rounded-[1.5rem] border border-border bg-card">
                  <div className="border-b border-border p-6">
                    <p className="font-label text-[0.58rem] text-primary/60">Community service</p>
                    <h2 className="font-heading mt-2 text-3xl font-semibold leading-tight">{project.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{project.summary}</p>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{dateLabel(project.startsAt)}</span>
                      {project.location && <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{project.location}</span>}
                    </div>
                  </div>
                  <div className="space-y-5 p-6">
                    <Progress value={volunteerProgress}><span className="flex items-center gap-1.5 text-xs font-bold"><Users className="size-3.5" />{project.volunteerIds.length}{project.volunteerGoal ? ` of ${project.volunteerGoal}` : ""} volunteers</span></Progress>
                    <div className="flex flex-wrap gap-2">
                      <form action={joined ? leaveProjectAction.bind(null, project.id) : joinProjectAction.bind(null, project.id)}><Button type="submit" variant={joined ? "outline" : "default"} className="rounded-full">{joined ? "Leave project" : "I’ll volunteer"}</Button></form>
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
      </div>
    </div>
  );
}
