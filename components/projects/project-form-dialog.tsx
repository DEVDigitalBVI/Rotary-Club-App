"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { createProjectAction, updateProjectAction } from "@/app/(app)/projects/actions";
import type { ServiceProject } from "@/lib/data/projects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const focusAreas = [
  "Peacebuilding and conflict prevention", "Disease prevention and treatment",
  "Water, sanitation, and hygiene", "Maternal and child health",
  "Basic education and literacy", "Community economic development", "Supporting the environment",
];

const inputClass = "h-10 rounded-lg border border-input bg-background px-3 text-sm";
const datePart = (value: string | null) => value ? value.slice(0, 10) : "";
const timePart = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Tortola" }).format(new Date(value)) : "";
const money = (value: number | null) => value == null ? "" : String(value);

function Section({ title, hint, children, open = false }: { title: string; hint: string; children: React.ReactNode; open?: boolean }) {
  return <details open={open} className="group rounded-xl border border-border bg-card">
    <summary className="cursor-pointer list-none px-4 py-3"><p className="font-heading text-sm font-semibold text-foreground">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{hint}</p></summary>
    <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">{children}</div>
  </details>;
}

function Field({ label, name, defaultValue, type = "text", required = false, placeholder }: { label: string; name: string; defaultValue?: string; type?: string; required?: boolean; placeholder?: string }) {
  return <div className="flex flex-col gap-1.5"><Label htmlFor={`project-${name}`}>{label}</Label><Input id={`project-${name}`} name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} /></div>;
}

function Area({ label, name, defaultValue, placeholder, rows = 3, wide = true }: { label: string; name: string; defaultValue?: string; placeholder?: string; rows?: number; wide?: boolean }) {
  return <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}><Label htmlFor={`project-${name}`}>{label}</Label><Textarea id={`project-${name}`} name={name} defaultValue={defaultValue} placeholder={placeholder} rows={rows} /></div>;
}

export function ProjectFormDialog({ project }: { project?: ServiceProject }) {
  const editing = Boolean(project);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(null); }}>
    <Button type="button" variant={editing ? "outline" : "default"} onClick={() => setOpen(true)} className={editing ? "" : "font-heading"}>
      {editing ? <Pencil /> : <Plus />}{editing ? "Edit details" : "Create service project"}
    </Button>
    <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit service project" : "Plan a service project"}</DialogTitle>
        <DialogDescription>Structured to match Rotary International’s Service Project Center. Fill what you know now and complete the rest as the project develops.</DialogDescription>
      </DialogHeader>
      <form className="space-y-3" onSubmit={(event) => {
        event.preventDefault(); setError(null); const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = project ? await updateProjectAction(project.id, undefined, formData) : await createProjectAction(undefined, formData);
          if (result?.error) setError(result.error); else setOpen(false);
        });
      }}>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Section title="Overview" hint="The public description and Rotary classification." open>
          <Field label="Project title" name="title" defaultValue={project?.title} required />
          <Field label="Language" name="language" defaultValue={project?.language ?? "English"} />
          <Area label="Short summary" name="summary" defaultValue={project?.summary} rows={2} />
          <Area label="Detailed description" name="detailedDescription" defaultValue={project?.detailedDescription ?? ""} placeholder="Explain what the club will do and who it will serve." />
          <div className="flex flex-col gap-1.5"><Label htmlFor="project-areaOfFocus">Rotary area of focus</Label><select id="project-areaOfFocus" name="areaOfFocus" defaultValue={project?.areaOfFocus ?? ""} className={inputClass}><option value="">Select an area</option>{focusAreas.map((area) => <option key={area}>{area}</option>)}</select></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="project-status">Status</Label><select id="project-status" name="status" defaultValue={project?.status ?? "open"} className={inputClass}><option value="draft">Proposed / draft</option><option value="open">In progress / open</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <Area label="Categories — one per line" name="categories" defaultValue={project?.categories.join("\n")} rows={2} wide={false} />
          <Area label="Tags — one per line" name="tags" defaultValue={project?.tags.join("\n")} rows={2} wide={false} />
        </Section>
        <Section title="Community need and impact" hint="RI asks how the need was identified and how results will last.">
          <Area label="Community assessment" name="communityAssessment" defaultValue={project?.communityAssessment ?? ""} placeholder="How did the team learn about the community’s needs?" />
          <Area label="Expected or achieved impact" name="projectImpact" defaultValue={project?.projectImpact ?? ""} placeholder="How will this help after the project ends?" />
          <Area label="Sustainability plan" name="sustainabilityPlan" defaultValue={project?.sustainabilityPlan ?? ""} placeholder="How will the benefits continue?" />
          <Field label="Beneficiaries reached" name="beneficiariesReached" type="number" defaultValue={money(project?.beneficiariesReached ?? null)} />
        </Section>
        <Section title="Timeline and location" hint="Use precise details so the project can be mapped and reported in the correct Rotary year.">
          <Field label="Start date" name="date" type="date" defaultValue={datePart(project?.startsAt ?? null)} required />
          <Field label="Start time" name="time" type="time" defaultValue={timePart(project?.startsAt ?? null) || "09:00"} />
          <Field label="End date" name="endDate" type="date" defaultValue={datePart(project?.endsAt ?? null)} />
          <Field label="End time" name="endTime" type="time" defaultValue={timePart(project?.endsAt ?? null)} />
          <Field label="Venue or location name" name="location" defaultValue={project?.location ?? ""} />
          <Field label="Street address" name="address" defaultValue={project?.address ?? ""} />
          <Field label="City" name="city" defaultValue={project?.city ?? ""} />
          <Field label="Territory / state" name="territory" defaultValue={project?.territory ?? ""} placeholder="Tortola" />
          <Field label="Country" name="country" defaultValue={project?.country ?? "British Virgin Islands"} />
        </Section>
        <Section title="People and collaboration" hint="Track volunteer targets, contacts, partners, and support still needed.">
          <Field label="Volunteer goal" name="volunteerGoal" type="number" defaultValue={money(project?.volunteerGoal ?? null)} />
          <Field label="Volunteer-hours goal" name="hoursGoal" type="number" defaultValue={money(project?.hoursGoal ?? null)} />
          <Area label="Project contacts — one per line" name="projectContacts" defaultValue={project?.projectContacts.join("\n")} rows={2} wide={false} />
          <Area label="Partner organizations — one per line" name="partnerOrganizations" defaultValue={project?.partnerOrganizations.join("\n")} rows={2} wide={false} />
          <Area label="Collaboration needs — one per line" name="collaborationNeeds" defaultValue={project?.collaborationNeeds.join("\n")} placeholder="Funding&#10;Volunteers&#10;Materials or expertise" rows={3} />
        </Section>
        <Section title="Funding and grants" hint="Planned figures for proposals; actual contributions when the work is complete.">
          <Field label="Currency" name="currency" defaultValue={project?.currency ?? "USD"} />
          <Field label="Estimated budget" name="estimatedBudget" type="number" defaultValue={money(project?.estimatedBudget ?? null)} />
          <Field label="Amount pledged" name="amountPledged" type="number" defaultValue={money(project?.amountPledged ?? null)} />
          <Field label="Actual cash contributions" name="cashContributions" type="number" defaultValue={money(project?.cashContributions ?? null)} />
          <Field label="Actual in-kind contributions" name="inKindContributions" type="number" defaultValue={money(project?.inKindContributions ?? null)} />
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" name="isRotaryGrant" defaultChecked={project?.isRotaryGrant} className="size-4 accent-primary" />Funded by a Rotary grant</label>
          <Field label="Grant type" name="grantType" defaultValue={project?.grantType ?? ""} placeholder="District grant or Global grant" />
          <Field label="Grant number" name="grantNumber" defaultValue={project?.grantNumber ?? ""} />
          <Field label="Grant amount" name="grantAmount" type="number" defaultValue={money(project?.grantAmount ?? null)} />
        </Section>
        <Section title="Media and related links" hint="Keep evidence and public references together for RI reporting.">
          <Field label="Cover image URL" name="coverImageUrl" type="url" defaultValue={project?.coverImageUrl ?? ""} />
          <Area label="Related links — one per line" name="relatedLinks" defaultValue={project?.relatedLinks.join("\n")} rows={2} wide={false} />
          <Area label="Video links — one per line" name="videoLinks" defaultValue={project?.videoLinks.join("\n")} rows={2} wide={false} />
        </Section>
        <Section title="Rotary International tracking" hint="Complete after entering the project in the Service Project Center.">
          <Field label="RI project ID" name="riProjectId" defaultValue={project?.riProjectId ?? ""} />
          <Field label="RI project URL" name="riProjectUrl" type="url" defaultValue={project?.riProjectUrl ?? ""} />
          <Field label="Uploaded to RI on" name="riUploadedAt" type="date" defaultValue={project?.riUploadedAt ?? ""} />
        </Section>
        <DialogFooter className="sticky -bottom-4 border-t border-border bg-background py-4">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={pending} className="font-heading">{pending ? "Saving…" : editing ? "Save project" : "Create project"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
