"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { MakeupEntry } from "@/lib/data/attendance";
import { markMakeupBatchLogged } from "@/app/(app)/account/actions";
import { serviceRecordCsv } from "@/lib/service-record";

export function PendingMakeups({ makeups }: { makeups: MakeupEntry[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState(false);
  const visible = makeups.filter(row => `${row.memberName} ${row.clubOrEvent} ${row.attendedOn}`.toLowerCase().includes(query.toLowerCase()) && (kind === "all" || (kind === "corrections") === row.voided));
  const chosen = visible.filter(row => selected.includes(row.id));
  function download() {
    const csv = serviceRecordCsv([], visible.map(row => ({ id: row.id, date: row.attendedOn, title: `${row.memberName}: ${row.clubOrEvent}`, projectId: null, voided: Boolean(row.voided), logged: row.clubrunnerLogged })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "clubrunner-makeups.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="rounded-2xl border border-border bg-card p-4 sm:p-5"><h2 className="text-xl">Makeups pending ClubRunner entry</h2>
    <div className="my-4 grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto_auto] sm:items-end"><label className="flex min-w-0 flex-col gap-1.5 text-sm">Search<input value={query} onChange={e => { setQuery(e.target.value); setReview(false); }} placeholder="Member, event or date" className="h-10 min-w-0 w-full rounded border bg-background px-3" /></label><label className="flex min-w-0 flex-col gap-1.5 text-sm">Show<select className="h-10 w-full rounded border bg-background px-3 sm:w-auto" value={kind} onChange={e => { setKind(e.target.value); setReview(false); }}><option value="all">All</option><option value="additions">Additions</option><option value="corrections">Corrections</option></select></label><Button className="w-full sm:w-auto" variant="outline" disabled={!visible.length} onClick={download}>Export filtered list</Button></div>
    {error && <p role="alert" className="my-3 text-sm text-destructive">{error}</p>}
    <p className="mb-3 text-sm text-muted-foreground">{visible.length} entries · {chosen.length} selected</p>
    <label className="text-sm"><input type="checkbox" checked={visible.length > 0 && chosen.length === visible.length} onChange={e => { setSelected(e.target.checked ? visible.slice(0, 200).map(row => row.id) : []); setReview(false); }} /> Select visible entries (up to 200)</label>
    <ul className="my-4 divide-y divide-border">{visible.map(row => <li key={row.id} className="flex items-start gap-3 py-3"><input className="mt-1 shrink-0" aria-label={`Select ${row.memberName}: ${row.clubOrEvent}`} type="checkbox" disabled={pending} checked={selected.includes(row.id)} onChange={e => { setSelected(ids => e.target.checked ? [...ids, row.id] : ids.filter(id => id !== row.id)); setReview(false); }} /><div className="min-w-0"><p className="break-words text-sm font-semibold">{row.memberName}</p><p className="break-words text-sm">{row.voided ? "Remove from ClubRunner" : "Add to ClubRunner"}: {row.clubOrEvent} · {formatDate(row.attendedOn)}</p>{row.notes && <p className="break-words text-xs text-muted-foreground">{row.notes}</p>}</div></li>)}</ul>
    {!visible.length && <p className="py-5 text-sm text-muted-foreground">No entries match these filters.</p>}
    {chosen.length > 0 && <div className="rounded-xl border border-border p-4"><label className="flex items-start gap-2 text-sm"><input className="mt-1 shrink-0" type="checkbox" checked={review} onChange={e => setReview(e.target.checked)} /><span>I have entered {chosen.filter(row => !row.voided).length} additions and completed {chosen.filter(row => row.voided).length} corrections in ClubRunner.</span></label><Button className="mt-3 w-full sm:w-auto" disabled={pending || !review || chosen.length > 200} onClick={() => start(async () => { setError(""); try { const result = await markMakeupBatchLogged(chosen.map(row => ({ id: row.id, voided: Boolean(row.voided) }))); if (result.error) setError(result.error); else { setSelected([]); setReview(false); } } catch { setError("Couldn’t confirm completion. Refresh before retrying."); } })}>{pending ? "Saving…" : "Confirm selected entries"}</Button></div>}
  </section>;
}
