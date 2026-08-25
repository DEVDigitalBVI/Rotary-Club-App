"use client";

import { useMemo, useState } from "react";
import { Check, Clipboard, ExternalLink } from "lucide-react";
import type { ServiceProject } from "@/lib/data/projects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { projectReadiness } from "@/lib/project-readiness";

const list = (values: string[]) => values.length ? values.join(", ") : "—";
const amount = (value: number | null, currency: string) => value == null ? "—" : `${currency} ${value.toLocaleString()}`;

export function RiProjectSummary({ project }: { project: ServiceProject }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const readiness = projectReadiness(project);
  const summary = useMemo(() => [
    `PROJECT TITLE\n${project.title}`, `STATUS\n${project.status}`, `LANGUAGE\n${project.language}`,
    `SHORT SUMMARY\n${project.summary}`, `DETAILED DESCRIPTION\n${project.detailedDescription ?? "—"}`,
    `AREA OF FOCUS\n${project.areaOfFocus ?? "—"}`, `CATEGORIES\n${list(project.categories)}`, `TAGS\n${list(project.tags)}`,
    `PROJECT LOCATION\n${[project.location, project.address, project.city, project.territory, project.country].filter(Boolean).join(", ")}`,
    `COMMUNITY ASSESSMENT\n${project.communityAssessment ?? "—"}`, `PROJECT IMPACT\n${project.projectImpact ?? "—"}`,
    `SUSTAINABILITY\n${project.sustainabilityPlan ?? "—"}`, `TIMELINE\n${project.startsAt?.slice(0, 10) ?? "To be determined"} to ${project.endsAt?.slice(0, 10) ?? "Ongoing"}`,
    `TOTAL ESTIMATED BUDGET\n${amount(project.estimatedBudget, project.currency)}`, `AMOUNT PLEDGED\n${amount(project.amountPledged, project.currency)}`,
    `AMOUNT STILL NEEDED\n${project.estimatedBudget == null ? "—" : amount(Math.max(0, project.estimatedBudget - (project.amountPledged ?? 0)), project.currency)}`,
    `ROTARY GRANT\n${project.isRotaryGrant ? [project.grantType, project.grantNumber, amount(project.grantAmount, project.currency)].filter(Boolean).join(" · ") : "No"}`,
    `PARTNERS\n${list(project.partnerOrganizations)}`, `CONTACTS\n${list(project.projectContacts)}`, `COLLABORATION NEEDS\n${list(project.collaborationNeeds)}`,
    `ENGAGEMENT\n${project.volunteerIds.length} volunteers · ${project.approvedHours} approved hours · ${project.beneficiariesReached ?? "—"} beneficiaries`,
    `CONTRIBUTIONS\nCash: ${amount(project.cashContributions, project.currency)} · In-kind: ${amount(project.inKindContributions, project.currency)}`,
    `RELATED LINKS\n${list([...project.relatedLinks, ...project.videoLinks])}`,
  ].join("\n\n"), [project]);

  return <Dialog open={open} onOpenChange={setOpen}>
    <Button type="button" variant="secondary" onClick={() => setOpen(true)}><ExternalLink />RI summary</Button>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>RI submission summary</DialogTitle><DialogDescription>Copy-ready details ordered to mirror the Service Project Center.</DialogDescription></DialogHeader>
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-4"><p className="font-heading text-sm font-semibold">{readiness.percent}% ready</p><div className="h-2 w-36 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${readiness.percent}%` }} /></div></div>
        {readiness.missing.length > 0 && <p className="mt-2 text-xs leading-5 text-muted-foreground">Still useful to add: {readiness.missing.join(", ")}.</p>}
      </div>
      <pre className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 font-body text-xs leading-5 text-foreground">{summary}</pre>
      <Button type="button" onClick={async () => { await navigator.clipboard.writeText(summary); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }}>
        {copied ? <Check /> : <Clipboard />}{copied ? "Copied" : "Copy RI summary"}
      </Button>
    </DialogContent>
  </Dialog>;
}
