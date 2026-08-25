"use client";

import { useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
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

const inputClass = "h-10 w-full min-w-0 max-w-full rounded-lg border border-input bg-background px-3 text-sm";
const datePart = (value: string | null) => value ? value.slice(0, 10) : "";
const timePart = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Tortola" }).format(new Date(value)) : "";
const money = (value: number | null) => value == null ? "" : String(value);

const steps = [
  { label: "Overview", eyebrow: "The idea" },
  { label: "Impact", eyebrow: "The why" },
  { label: "Place & time", eyebrow: "The where" },
  { label: "People", eyebrow: "The team" },
  { label: "Funding", eyebrow: "The resources" },
  { label: "Media & RI", eyebrow: "The handoff" },
];

function StepPanel({ active, title, hint, children }: { active: boolean; title: string; hint: string; children: React.ReactNode }) {
  return <section hidden={!active} className="animate-in fade-in slide-in-from-right-2 duration-200">
    <div className="mb-5"><h3 className="font-heading text-xl font-semibold text-foreground">{title}</h3><p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{hint}</p></div>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </section>;
}

function Field({ label, name, defaultValue, type = "text", required = false, placeholder }: { label: string; name: string; defaultValue?: string; type?: string; required?: boolean; placeholder?: string }) {
  return <div className="flex min-w-0 flex-col gap-1.5"><Label htmlFor={`project-${name}`}>{label}</Label><Input id={`project-${name}`} name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} /></div>;
}

function Area({ label, name, defaultValue, placeholder, rows = 3, wide = true }: { label: string; name: string; defaultValue?: string; placeholder?: string; rows?: number; wide?: boolean }) {
  return <div className={`flex min-w-0 flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}><Label htmlFor={`project-${name}`}>{label}</Label><Textarea className="max-w-full" id={`project-${name}`} name={name} defaultValue={defaultValue} placeholder={placeholder} rows={rows} /></div>;
}

export function ProjectFormDialog({ project }: { project?: ServiceProject }) {
  const editing = Boolean(project);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function goToStep(next: number) {
    setError(null);
    setStep(Math.max(0, Math.min(steps.length - 1, next)));
  }

  function advance() {
    if (!formRef.current) return;
    const values = new FormData(formRef.current);
    if (step === 0 && (!String(values.get("title") ?? "").trim() || !String(values.get("summary") ?? "").trim())) {
      setError("Add a project title and short summary before continuing."); return;
    }
    goToStep(step + 1);
  }

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setError(null); setStep(0); } }}>
    <Button type="button" variant={editing ? "outline" : "default"} onClick={() => setOpen(true)} className={editing ? "" : "font-heading"}>
      {editing ? <Pencil /> : <Plus />}{editing ? "Edit details" : "Create service project"}
    </Button>
    <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-hidden rounded-2xl p-0 sm:max-h-[92dvh] sm:max-w-4xl" contentClassName="flex min-h-0 flex-col overflow-hidden gap-0">
      <div className="shrink-0 border-b border-border px-4 pt-4 sm:px-7 sm:pt-5">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit service project" : "Plan a service project"}</DialogTitle>
        <DialogDescription className="pr-7">One section at a time. Save whenever you need to stop and return later.</DialogDescription>
      </DialogHeader>
      <div className="mt-4 flex items-center gap-3 pb-4 sm:hidden">
        <div className="shrink-0 text-center"><p className="font-heading text-lg font-semibold text-primary">{step + 1}</p><p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">of {steps.length}</p></div>
        <select aria-label="Project form section" value={step} onChange={(event) => goToStep(Number(event.target.value))} className={inputClass}>
          {steps.map((item, index) => <option key={item.label} value={index}>{item.label} · {item.eyebrow}</option>)}
        </select>
      </div>
      <div className="mt-5 hidden gap-1 overflow-x-auto pb-4 sm:flex" aria-label="Project form progress">
        {steps.map((item, index) => <button key={item.label} type="button" onClick={() => goToStep(index)} aria-current={index === step ? "step" : undefined} className={`group min-w-[7.5rem] flex-1 rounded-xl px-3 py-2 text-left transition-colors ${index === step ? "bg-primary text-primary-foreground" : index < step ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground hover:bg-muted"}`}>
          <span className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] opacity-75">{index < step ? <Check className="size-3" /> : `0${index + 1}`} {item.eyebrow}</span>
          <span className="mt-1 block text-xs font-semibold">{item.label}</span>
        </button>)}
      </div>
      </div>
      <form ref={formRef} noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => {
        event.preventDefault(); setError(null); const formData = new FormData(event.currentTarget);
        if (!String(formData.get("title") ?? "").trim() || !String(formData.get("summary") ?? "").trim()) { setStep(0); setError("Title and short summary are required."); return; }
        startTransition(async () => {
          const result = project ? await updateProjectAction(project.id, undefined, formData) : await createProjectAction(undefined, formData);
          if (result?.error) setError(result.error); else setOpen(false);
        });
      }}>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-7">
        {error && <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <StepPanel active={step === 0} title="Shape the project" hint="Start with the story members and Rotary International will see.">
          <Field label="Project title" name="title" defaultValue={project?.title} required />
          <Field label="Language" name="language" defaultValue={project?.language ?? "English"} />
          <Area label="Short summary" name="summary" defaultValue={project?.summary} rows={2} />
          <Area label="Detailed description" name="detailedDescription" defaultValue={project?.detailedDescription ?? ""} placeholder="Explain what the club will do and who it will serve." />
          <div className="flex flex-col gap-1.5"><Label htmlFor="project-areaOfFocus">Rotary area of focus</Label><select id="project-areaOfFocus" name="areaOfFocus" defaultValue={project?.areaOfFocus ?? ""} className={inputClass}><option value="">Select an area</option>{focusAreas.map((area) => <option key={area}>{area}</option>)}</select></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="project-status">Status</Label><select id="project-status" name="status" defaultValue={project?.status ?? "draft"} className={inputClass}><option value="draft">Proposed / draft</option><option value="open">In progress / open</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <Area label="Categories — one per line" name="categories" defaultValue={project?.categories.join("\n")} rows={2} wide={false} />
          <Area label="Tags — one per line" name="tags" defaultValue={project?.tags.join("\n")} rows={2} wide={false} />
        </StepPanel>
        <StepPanel active={step === 1} title="Define the need and impact" hint="Capture why this work matters, what success looks like, and how the benefits will continue.">
          <Area label="Community assessment" name="communityAssessment" defaultValue={project?.communityAssessment ?? ""} placeholder="How did the team learn about the community’s needs?" />
          <Area label="Expected or achieved impact" name="projectImpact" defaultValue={project?.projectImpact ?? ""} placeholder="How will this help after the project ends?" />
          <Area label="Sustainability plan" name="sustainabilityPlan" defaultValue={project?.sustainabilityPlan ?? ""} placeholder="How will the benefits continue?" />
          <Field label="Beneficiaries reached" name="beneficiariesReached" type="number" defaultValue={money(project?.beneficiariesReached ?? null)} />
        </StepPanel>
        <StepPanel active={step === 2} title="Set the place and timeline" hint="Precise dates determine the Rotary reporting year and location details help the project appear correctly in RI search and maps.">
          <Field label="Start date" name="date" type="date" defaultValue={datePart(project?.startsAt ?? null)} />
          <Field label="Start time" name="time" type="time" defaultValue={timePart(project?.startsAt ?? null) || "09:00"} />
          <Field label="End date" name="endDate" type="date" defaultValue={datePart(project?.endsAt ?? null)} />
          <Field label="End time" name="endTime" type="time" defaultValue={timePart(project?.endsAt ?? null)} />
          <Field label="Venue or location name" name="location" defaultValue={project?.location ?? ""} />
          <Field label="Street address" name="address" defaultValue={project?.address ?? ""} />
          <Field label="City" name="city" defaultValue={project?.city ?? ""} />
          <Field label="Territory / state" name="territory" defaultValue={project?.territory ?? ""} placeholder="Tortola" />
          <Field label="Country" name="country" defaultValue={project?.country ?? "British Virgin Islands"} />
        </StepPanel>
        <StepPanel active={step === 3} title="Bring the team together" hint="Record who owns the work, who is helping, and what support is still needed.">
          <Field label="Volunteer goal" name="volunteerGoal" type="number" defaultValue={money(project?.volunteerGoal ?? null)} />
          <Field label="Volunteer-hours goal" name="hoursGoal" type="number" defaultValue={money(project?.hoursGoal ?? null)} />
          <Area label="Project contacts — one per line" name="projectContacts" defaultValue={project?.projectContacts.join("\n")} rows={2} wide={false} />
          <Area label="Partner organizations — one per line" name="partnerOrganizations" defaultValue={project?.partnerOrganizations.join("\n")} rows={2} wide={false} />
          <Area label="Collaboration needs — one per line" name="collaborationNeeds" defaultValue={project?.collaborationNeeds.join("\n")} placeholder="Funding&#10;Volunteers&#10;Materials or expertise" rows={3} />
        </StepPanel>
        <StepPanel active={step === 4} title="Account for the resources" hint="Use estimates while planning and replace them with actual contributions when the project is complete.">
          <Field label="Currency" name="currency" defaultValue={project?.currency ?? "USD"} />
          <Field label="Estimated budget" name="estimatedBudget" type="number" defaultValue={money(project?.estimatedBudget ?? null)} />
          <Field label="Amount pledged" name="amountPledged" type="number" defaultValue={money(project?.amountPledged ?? null)} />
          <Field label="Actual cash contributions" name="cashContributions" type="number" defaultValue={money(project?.cashContributions ?? null)} />
          <Field label="Actual in-kind contributions" name="inKindContributions" type="number" defaultValue={money(project?.inKindContributions ?? null)} />
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2"><input type="checkbox" name="isRotaryGrant" defaultChecked={project?.isRotaryGrant} className="size-4 accent-primary" />Funded by a Rotary grant</label>
          <Field label="Grant type" name="grantType" defaultValue={project?.grantType ?? ""} placeholder="District grant or Global grant" />
          <Field label="Grant number" name="grantNumber" defaultValue={project?.grantNumber ?? ""} />
          <Field label="Grant amount" name="grantAmount" type="number" defaultValue={money(project?.grantAmount ?? null)} />
        </StepPanel>
        <StepPanel active={step === 5} title="Prepare the RI handoff" hint="Keep public evidence here, then add the Service Project Center reference after submission.">
          <Field label="Cover image URL" name="coverImageUrl" type="url" defaultValue={project?.coverImageUrl ?? ""} />
          <Area label="Related links — one per line" name="relatedLinks" defaultValue={project?.relatedLinks.join("\n")} rows={2} wide={false} />
          <Area label="Video links — one per line" name="videoLinks" defaultValue={project?.videoLinks.join("\n")} rows={2} wide={false} />
          <div className="my-2 border-t border-border sm:col-span-2" />
          <Field label="RI project ID" name="riProjectId" defaultValue={project?.riProjectId ?? ""} />
          <Field label="RI project URL" name="riProjectUrl" type="url" defaultValue={project?.riProjectUrl ?? ""} />
          <Field label="Uploaded to RI on" name="riUploadedAt" type="date" defaultValue={project?.riUploadedAt ?? ""} />
        </StepPanel>
        </div>
        <DialogFooter className="mx-0 mb-0 grid shrink-0 grid-cols-2 gap-2 rounded-none border-t border-border bg-background px-4 py-3 sm:flex sm:px-7 sm:py-4">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)} className="mr-auto hidden sm:inline-flex">Cancel</Button>
          {step > 0 && <Button type="button" variant="outline" disabled={pending} onClick={() => goToStep(step - 1)} className="order-1 w-full sm:order-none sm:w-auto"><ChevronLeft />Back</Button>}
          {step < steps.length - 1 && <Button type="submit" variant="outline" disabled={pending} className="order-3 col-span-2 w-full sm:order-none sm:w-auto">{pending ? "Saving…" : editing ? "Save & close" : "Save draft"}</Button>}
          {step < steps.length - 1 ? <Button type="button" disabled={pending} onClick={advance} className={`order-2 w-full sm:order-none sm:w-auto ${step === 0 ? "col-span-2" : ""}`}>Next<span className="hidden min-[400px]:inline">: {steps[step + 1].label}</span><ChevronRight /></Button> : <Button type="submit" disabled={pending} className="order-2 w-full font-heading sm:order-none sm:w-auto">{pending ? "Saving…" : editing ? "Save project" : "Create project"}</Button>}
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
