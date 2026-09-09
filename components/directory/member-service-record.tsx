"use client";
import Link from "next/link";
import { useState } from "react";
import { HandHeart } from "lucide-react";
import { rotaryYear } from "@/lib/my-rotary";
import { formatDate } from "@/lib/format";
import { recordYears, serviceTotals, type ServiceEntry } from "@/lib/service-record";

export function MemberServiceRecord({entries,today,isSelf}:{entries:ServiceEntry[];today:string;isSelf:boolean}) {
  const [year,setYear] = useState(rotaryYear(today).start);
  const filtered = entries.filter(row=>year==="all" || rotaryYear(row.date).start===year);
  const totals = serviceTotals(filtered,[]);
  const number = (n:number)=>new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n);
  return <section aria-labelledby="member-service-record" className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-3">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 sm:p-6"><div><h2 id="member-service-record" className="font-heading flex items-center gap-2 text-xl font-semibold"><HandHeart className="size-5 text-primary" />Service record</h2><p className="mt-1 text-sm text-muted-foreground">Recorded contributions to club projects.</p></div><label className="flex items-center gap-2 text-xs text-muted-foreground">Rotary year<select value={year} onChange={e=>setYear(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"><option value="all">All years</option>{recordYears(entries,[],today).map(value=><option key={value} value={value}>{rotaryYear(value).label}</option>)}</select></label></div>
    <div className="grid grid-cols-2 gap-5 bg-primary/5 px-5 py-6 sm:px-6" aria-live="polite"><div><p className="font-heading text-4xl font-semibold text-primary">{number(totals.hours)}<span className="ml-2 text-base font-normal">hrs</span></p><p className="mt-1 text-xs text-muted-foreground">Service hours</p></div><div><p className="font-heading text-4xl font-semibold text-primary">{totals.projects}</p><p className="mt-1 text-xs text-muted-foreground">Projects served</p></div></div>
    {filtered.length ? <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">{filtered.map(row=><li key={row.id} className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6"><div className="min-w-0"><Link href={`/projects/${row.projectId}`} className="font-medium hover:text-primary hover:underline">{row.project}</Link>{row.slot && <p className="mt-1 text-sm text-muted-foreground">{row.slot}</p>}<p className="mt-1 text-xs text-muted-foreground">{formatDate(row.date)}</p></div><span className="shrink-0 text-sm font-semibold text-primary">{number(row.hours)} hrs</span></li>)}</ul> : <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">No service hours recorded for {year==="all" ? "this member yet" : "this Rotary year"}.</p>}
    {isSelf && <div className="border-t border-border px-5 py-4 sm:px-6"><Link href="/service-record" className="text-sm font-semibold text-primary hover:underline">Open your full personal record →</Link></div>}
  </section>;
}
