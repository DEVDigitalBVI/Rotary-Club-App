"use client";

import { useState } from "react";
import { ArrowUpRight, CalendarDays, Clock3, HandHeart, Leaf, MapPin, Target, Users } from "lucide-react";
import type { ServiceProject } from "@/lib/data/projects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const date = (value: string) => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Tortola" }).format(new Date(value));
const amount = (value: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

function Story({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2 text-primary"><Icon className="size-4" /><h3 className="font-label text-[0.65rem]">{title}</h3></div><div className="font-body mt-3 text-sm leading-7 text-foreground">{children}</div></section>;
}

export function ProjectImpactDialog({ project }: { project: ServiceProject }) {
  const [open, setOpen] = useState(false);
  const location = [project.location, project.city, project.territory, project.country].filter(Boolean).join(", ");
  const hasEngagement = project.volunteerIds.length > 0 || project.approvedHours > 0 || project.beneficiariesReached != null;
  const hasFunding = project.estimatedBudget != null || project.cashContributions != null || project.inKindContributions != null;

  return <Dialog open={open} onOpenChange={setOpen}>
    <Button type="button" variant="secondary" onClick={() => setOpen(true)}><HandHeart />See the impact</Button>
    <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-3xl">
      {project.coverImageUrl && <div className="aspect-[16/6] overflow-hidden bg-muted">
        {/* External partner image hosts are not known at build time. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={project.coverImageUrl} alt="" className="size-full object-cover" />
      </div>}
      <div className="p-5 sm:p-7">
        <DialogHeader>
          {project.areaOfFocus && <p className="font-label text-[0.65rem] text-primary">{project.areaOfFocus}</p>}
          <DialogTitle className="text-2xl sm:text-3xl">{project.title}</DialogTitle>
          <DialogDescription className="text-sm leading-6">{project.summary}</DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {project.startsAt && <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{date(project.startsAt)}{project.endsAt ? ` — ${date(project.endsAt)}` : ""}</span>}
          {location && <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{location}</span>}
        </div>

        {hasEngagement && <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {project.volunteerIds.length > 0 && <div className="rounded-xl bg-primary/10 p-4"><Users className="size-4 text-primary" /><p className="mt-3 text-2xl font-semibold">{project.volunteerIds.length}</p><p className="text-xs text-muted-foreground">Volunteers</p></div>}
          {project.approvedHours > 0 && <div className="rounded-xl bg-primary/10 p-4"><Clock3 className="size-4 text-primary" /><p className="mt-3 text-2xl font-semibold">{project.approvedHours}</p><p className="text-xs text-muted-foreground">Service hours</p></div>}
          {project.beneficiariesReached != null && <div className="rounded-xl bg-primary/10 p-4"><HandHeart className="size-4 text-primary" /><p className="mt-3 text-2xl font-semibold">{project.beneficiariesReached}</p><p className="text-xs text-muted-foreground">People reached</p></div>}
        </div>}

        <div className="mt-6 grid gap-3">
          {project.detailedDescription && <Story icon={HandHeart} title="What we’re doing">{project.detailedDescription}</Story>}
          {project.communityAssessment && <Story icon={Target} title="The community need">{project.communityAssessment}</Story>}
          {project.projectImpact && <Story icon={ArrowUpRight} title={project.status === "completed" ? "The impact" : "The impact we’re working toward"}>{project.projectImpact}</Story>}
          {project.sustainabilityPlan && <Story icon={Leaf} title="How the impact will last">{project.sustainabilityPlan}</Story>}
        </div>

        {(project.partnerOrganizations.length > 0 || project.collaborationNeeds.length > 0) && <div className="mt-6 grid gap-4 rounded-2xl bg-muted/50 p-5 sm:grid-cols-2">
          {project.partnerOrganizations.length > 0 && <div><h3 className="font-heading text-sm font-semibold">Project partners</h3><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{project.partnerOrganizations.map((partner) => <li key={partner}>{partner}</li>)}</ul></div>}
          {project.collaborationNeeds.length > 0 && <div><h3 className="font-heading text-sm font-semibold">How members can help</h3><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{project.collaborationNeeds.map((need) => <li key={need}>{need}</li>)}</ul></div>}
        </div>}

        {hasFunding && <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-5 text-sm">
          {project.estimatedBudget != null && <p><span className="text-muted-foreground">Planned budget</span><br /><strong>{amount(project.estimatedBudget, project.currency)}</strong></p>}
          {project.cashContributions != null && <p><span className="text-muted-foreground">Cash contributed</span><br /><strong>{amount(project.cashContributions, project.currency)}</strong></p>}
          {project.inKindContributions != null && <p><span className="text-muted-foreground">In-kind value</span><br /><strong>{amount(project.inKindContributions, project.currency)}</strong></p>}
        </div>}

        {[...project.relatedLinks, ...project.videoLinks].length > 0 && <div className="mt-6 flex flex-wrap gap-2">{[...project.relatedLinks, ...project.videoLinks].map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-muted">Project link <ArrowUpRight className="size-3" /></a>)}</div>}
      </div>
    </DialogContent>
  </Dialog>;
}
