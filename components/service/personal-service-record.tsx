"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowDownToLine, ArrowUpRight, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { rotaryYear } from "@/lib/my-rotary";
import { recordYears, serviceTotals, serviceRecordCsv, type ServiceEntry, type ServiceMakeup } from "@/lib/service-record";

const number = (n:number) => new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n);
const statusLabel = {present:"Present",absent:"Absent",excused:"Excused",legacy:"Recorded hours"};
export function PersonalServiceRecord({ entries, makeups, today, memberName }: { entries: ServiceEntry[]; makeups: ServiceMakeup[]; today: string; memberName: string }) {
  const [year,setYear] = useState(rotaryYear(today).start);
  const [project,setProject] = useState("all");
  const years = recordYears(entries,makeups,today);
  const projects = [...new Map(entries.map(row=>[row.projectId,row.project])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  const matches = (date:string,projectId:string|null) => (year==="all" || rotaryYear(date).start===year) && (project==="all" || projectId===project);
  const visible = entries.filter(row=>matches(row.date,row.projectId));
  const credits = makeups.filter(row=>matches(row.date,row.projectId));
  const totals = serviceTotals(visible,credits);
  function download() {
    const url = URL.createObjectURL(new Blob([serviceRecordCsv(visible,credits)],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a"); link.href=url; link.download=`service-record-${year}.csv`; link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <div className="mx-auto max-w-6xl space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">← My Rotary</Link><Button variant="outline" onClick={download} disabled={!visible.length && !credits.length}><ArrowDownToLine className="size-4" />Download CSV</Button></div>
    <section className="overflow-hidden rounded-3xl bg-[var(--feature-surface)] text-white">
      <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1.2fr_1fr]">
        <div><p className="font-label flex items-center gap-2 text-[var(--rotary-gold)]"><HandHeart className="size-4" />Service above self</p><p className="mt-5 text-sm text-white/75">{memberName} · {year==="all" ? "All Rotary years" : rotaryYear(year).label}</p><p className="font-heading mt-2 text-7xl font-semibold tracking-tight">{number(totals.hours)}<span className="ml-2 text-2xl font-normal text-white/75">hours</span></p><p className="mt-3 max-w-md text-sm leading-6 text-white/75">Recorded service, credited as soon as your attendance is saved.</p></div>
        <dl className="grid grid-cols-3 items-center gap-3 border-t border-white/20 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">{[[totals.projects,"Projects served"],[totals.attendances,"Slots attended"],[totals.makeups,"Meeting makeups"]].map(([count,label])=><div key={label}><dd className="font-heading text-3xl font-semibold text-[var(--rotary-gold)]">{count}</dd><dt className="mt-2 text-xs leading-5 text-white/75">{label}</dt></div>)}</dl>
      </div>
    </section>
    <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4">
      <label className="flex min-w-44 flex-1 flex-col gap-2 text-xs font-semibold text-muted-foreground">Rotary year<select value={year} onChange={e=>setYear(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"><option value="all">All years</option>{years.map(value=><option key={value} value={value}>{rotaryYear(value).label}</option>)}</select></label>
      <label className="flex min-w-44 flex-1 flex-col gap-2 text-xs font-semibold text-muted-foreground">Project<select value={project} onChange={e=>setProject(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"><option value="all">All projects and makeups</option>{projects.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label>
    </div>
    <section aria-labelledby="service-history"><div className="mb-4 flex items-end justify-between gap-3"><h2 id="service-history" className="font-heading text-2xl font-semibold">Service history</h2><span className="text-xs text-muted-foreground" aria-live="polite">{visible.length} records</span></div>
      {visible.length ? <ul className="divide-y divide-border rounded-2xl border border-border bg-card">{visible.map(row=><li key={row.id} className="grid gap-3 p-5 sm:grid-cols-[7rem_1fr_auto]"><p className="text-xs text-muted-foreground">{formatDate(row.date)}</p><div className="min-w-0"><Link href={`/projects/${row.projectId}`} className="font-semibold hover:text-primary hover:underline">{row.project}</Link>{row.slot && <p className="mt-1 text-sm text-muted-foreground">{row.slot}</p>}{row.note && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">{row.note}</p>}</div><div className="flex items-center justify-between gap-4 sm:block sm:text-right"><p className="font-heading text-xl font-semibold text-primary">{number(row.hours)} <span className="text-xs font-normal">hrs</span></p><span className="mt-1 inline-block rounded-full bg-muted px-2.5 py-1 text-xs">{statusLabel[row.attendance]}</span></div></li>)}</ul> : <div className="rounded-2xl border border-dashed border-border p-8 text-center"><p className="font-heading text-xl">No service recorded for this selection yet.</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Your project lead or secretary records attendance after you serve. Choose a time slot to get involved.</p><Link href="/projects" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Explore projects <ArrowUpRight className="size-4" /></Link></div>}
    </section>
    <section aria-labelledby="makeup-history"><h2 id="makeup-history" className="font-heading text-2xl font-semibold">Meeting makeups</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Makeups are separate from regular meeting attendance. Service across several slots on the same project day earns one makeup.</p>
      {credits.length ? <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">{credits.map(row=><li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-medium">{row.title}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(row.date)}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{row.voided ? "Removed from your credits" : row.logged ? "Logged in ClubRunner" : "Pending ClubRunner entry"}</span></li>)}</ul> : <p className="mt-4 rounded-xl border border-border p-5 text-sm text-muted-foreground">No meeting makeups for this selection.</p>}
    </section>
    <p className="border-t border-border pt-5 text-xs leading-6 text-muted-foreground">Something missing or incorrect? Contact your project lead or club secretary. Historical hours may appear without a slot attendance record. Removed makeups remain visible here but do not count toward your totals.</p>
  </div>;
}
