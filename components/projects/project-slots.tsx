"use client";
import { useState, useTransition } from "react";
import { CalendarDays, Clock3, Users, ShieldCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Member, Committee } from "@/lib/club";
import type { ServiceProject } from "@/lib/data/projects";
import type { getProjectSlots, ProjectSlot, SlotSignup } from "@/lib/data/project-slots";
import { formatDate, formatTime, toClubDateString } from "@/lib/format";
import { assignProjectTeam, saveProjectSlot, changeProjectSignup, cancelProjectSlot, recordProjectAttendance, type SlotResult } from "@/app/(app)/projects/slot-actions";

type Workflow = Awaited<ReturnType<typeof getProjectSlots>>;
const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";
const duration = (slot: ProjectSlot) => Math.round((Date.parse(slot.ends_at) - Date.parse(slot.starts_at)) / 36000) / 100;

export function ProjectSlots({ project, member, members, committees, workflow, serverNow }: { serverNow: string; project: ServiceProject; member: Member; members: Member[]; committees: Committee[]; workflow: Workflow }) {
  const now = Date.parse(serverNow);
  const [committee, setCommittee] = useState(workflow.committeeId);
  const [result, setResult] = useState<SlotResult>();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<ProjectSlot | null>(null);
  const team = members.filter((m) => m.status !== "inactive" && committees.find((c) => c.id === committee)?.memberIds.includes(m.id));
  const mySignups = workflow.signups.filter((r) => r.member_id === member.id);
  function run(action: () => Promise<SlotResult>) {
    setResult(undefined);
    start(async () => { try { setResult(await action()); } catch { setResult({ error: "Unable to save. Please refresh and try again." }); } });
  }
  return <div className="mt-6 space-y-6">
    <section className="rounded-2xl bg-[var(--feature-surface)] p-6 text-white">
      <p className="font-label text-[var(--rotary-gold)]">Choose your place in the project</p>
      <h2 className="font-heading mt-2 text-3xl font-semibold">A little time. A shared impact.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/75">Choose a time slot below. After you attend, the secretary or project leader records your hours and a meeting makeup. Multiple slots on the same project day earn one makeup.</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">{workflow.leaders.map((leader) => <span key={leader.role}><ShieldCheck className="mr-1 inline size-4 text-[var(--rotary-gold)]" />{leader.role === "lead" ? "Project lead" : "Deputy"}: {members.find((m) => m.id === leader.member_id)?.name ?? "Member"}</span>)}</div>
    </section>
    {result && <p role={result.error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${result.error ? "border-destructive text-destructive" : "border-primary text-primary"}`}>{result.error ?? result.success}</p>}

    {workflow.canAssign && <details className="rounded-2xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">Assign project lead & deputy</summary><form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); const form = new FormData(e.currentTarget); run(() => assignProjectTeam(project.id, form)); }}>
      <label className="text-sm">Responsible committee<select name="committee" value={committee} onChange={(e) => setCommittee(e.target.value)} className={selectClass}>{committees.filter((c) => c.id !== "board").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {(["lead", "deputy"] as const).map((role) => <label key={`${role}-${committee}`} className="text-sm">{role === "lead" ? "Project lead" : "Deputy"}<select name={role} defaultValue={committee === workflow.committeeId ? workflow.leaders.find((l) => l.role === role)?.member_id ?? "" : ""} className={selectClass}><option value="">Not assigned</option>{team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>)}
      <p className="text-xs leading-6 text-muted-foreground sm:col-span-3">Choose members of the responsible committee. This grants access to this project’s slots and attendance only. Club officers can change the responsible committee.</p><Button disabled={pending} type="submit">Save leadership</Button>
    </form></details>}

    {workflow.canManage && ["draft", "open"].includes(project.status) && <details className="rounded-2xl border border-border bg-card p-5" open={editing ? true : undefined}><summary className="cursor-pointer font-semibold"><Plus className="mr-1 inline size-4" />{editing ? "Edit empty slot" : "Add a time slot"}</summary><form key={editing?.id ?? "new"} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); const form = new FormData(e.currentTarget); run(async () => { const response = await saveProjectSlot(project.id, editing?.id ?? null, form); if (!response.error) setEditing(null); return response; }); }}>
      <label className="text-sm">Role or slot name<Input name="title" required maxLength={150} placeholder="Food packing" defaultValue={editing?.title} /></label>
      <label className="text-sm">Date<Input name="date" type="date" required defaultValue={editing ? toClubDateString(editing.starts_at) : undefined} /></label>
      <label className="text-sm">Places<Input name="capacity" type="number" min={1} max={1000} required defaultValue={editing?.capacity ?? 6} /></label>
      <label className="text-sm">Start (BVI time)<Input name="start" type="time" required defaultValue={editing ? clubTimeInput(editing.starts_at) : undefined} /></label>
      <label className="text-sm">End (same day)<Input name="end" type="time" required defaultValue={editing ? clubTimeInput(editing.ends_at) : undefined} /></label>
      <label className="text-sm">Signup cutoff (optional)<Input name="cutoff" type="datetime-local" defaultValue={editing ? `${toClubDateString(editing.signup_closes_at)}T${clubTimeInput(editing.signup_closes_at)}` : undefined} /></label>
      <label className="text-sm sm:col-span-2">Location<Input name="location" defaultValue={editing?.location ?? project.location ?? ""} /></label>
      <p className="text-xs text-muted-foreground sm:col-span-2">If no cutoff is entered, signups close when the slot starts. Slots with signups must be cancelled and replaced to change their time.</p><Button disabled={pending} type="submit">{editing ? "Save slot" : "Add slot"}</Button>
    </form></details>}

    <div className="grid gap-5 lg:grid-cols-2">{workflow.slots.map((slot) => {
      const own = mySignups.find((r) => r.slot_id === slot.id);
      const closed = slot.cancelled || project.status !== "open" || Date.parse(slot.signup_closes_at) <= now;
      return <section key={slot.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="font-label flex items-center gap-2 text-primary"><CalendarDays className="size-4" />{formatDate(toClubDateString(slot.starts_at))}</p><h3 className="font-heading mt-2 text-2xl font-semibold">{slot.title}</h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />{formatTime(slot.starts_at)} – {formatTime(slot.ends_at)} · {duration(slot)} hours</p><p className="mt-2 text-sm text-muted-foreground">{slot.location}</p>
        <p className="mt-3 flex items-center gap-2 text-sm"><Users className="size-4" />{Math.max(0, slot.capacity-slot.registered)} of {slot.capacity} places available{slot.waitlisted > 0 ? ` · ${slot.waitlisted} waiting` : ""}</p>
        <p className="mt-2 text-xs text-muted-foreground">Signup closes {formatDate(toClubDateString(slot.signup_closes_at))} at {formatTime(slot.signup_closes_at)}</p>
        {slot.cancelled ? <p className="mt-3 font-semibold text-destructive">Cancelled</p> : own && <p className="mt-3 text-sm font-semibold text-primary">{own.attendance ? `${own.attendance.charAt(0).toUpperCase()+own.attendance.slice(1)} · ${own.credited_hours} hours credited` : own.status === "waitlisted" ? "You’re on the waitlist" : "You’re booked"}</p>}
        {!closed && <div className="mt-4 flex flex-wrap gap-2">{own ? <Button disabled={pending} variant="outline" onClick={() => run(() => changeProjectSignup(slot.id, true))}>Cancel my signup</Button> : <><Button disabled={pending} onClick={() => run(() => changeProjectSignup(slot.id))}>{slot.registered >= slot.capacity ? "Join waitlist" : "Choose this slot"}</Button>{mySignups.some((r) => workflow.slots.some((s) => s.id===r.slot_id && !s.cancelled && Date.parse(s.signup_closes_at)>now)) && <select aria-label={`Switch an existing booking to ${slot.title}`} className={selectClass} value="" disabled={pending} onChange={(e) => { const previous=e.target.value; if(previous) run(() => changeProjectSignup(slot.id,false,previous)); }}><option value="">Switch an existing booking…</option>{mySignups.filter((r) => workflow.slots.some((s) => s.id===r.slot_id && !s.cancelled && Date.parse(s.signup_closes_at)>now)).map((r) => <option key={r.slot_id} value={r.slot_id}>Switch from {workflow.slots.find((s) => s.id===r.slot_id)?.title}</option>)}</select>}</>}</div>}
        {closed && !slot.cancelled && !own && <p className="mt-3 text-sm text-muted-foreground">Signups closed</p>}
        {workflow.canManage && !slot.cancelled && <div className="mt-5 border-t border-border pt-4"><div className="flex gap-2">{slot.registered+slot.waitlisted===0 && Date.parse(slot.starts_at)>now && <Button variant="outline" size="sm" onClick={() => setEditing(slot)}>Edit slot</Button>}{!workflow.signups.some((r) => r.slot_id===slot.id && r.attendance) && <Button variant="outline" size="sm" disabled={pending} onClick={() => { if (window.confirm("Cancel this slot and notify its members?")) run(() => cancelProjectSlot(slot.id)); }}>Cancel slot</Button>}</div><ul className="mt-3 space-y-1 text-xs text-muted-foreground">{workflow.signups.filter((r) => r.slot_id===slot.id).map((r) => <li key={r.member_id}>{members.find((m)=>m.id===r.member_id)?.name ?? "Former member"} · {r.status}</li>)}</ul>{Date.parse(slot.starts_at)<=now ? <AttendanceForm slot={slot} members={members} signups={workflow.signups.filter((r) => r.slot_id===slot.id)} /> : <p className="mt-3 text-xs text-muted-foreground">Attendance opens when this slot starts.</p>}
        </div>}
      </section>;
    })}</div>
    {workflow.slots.length===0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No time slots yet. {workflow.canManage ? "Add the first slot above." : "The project team will publish the schedule here."}</p>}
    {workflow.canManage && workflow.audit.length>0 && <details className="rounded-2xl border border-border p-5"><summary className="cursor-pointer font-semibold">Attendance history · latest 30 changes</summary><ul className="mt-4 divide-y divide-border">{workflow.audit.map((item) => <li key={item.id} className="py-3 text-sm"><strong>{members.find((m)=>m.id===item.member_id)?.name ?? "Member"}</strong> · {item.previous_state?.attendance ?? "Unrecorded"} → {item.next_state.attendance} · {item.next_state.credited_hours} hrs<p className="mt-1 text-xs text-muted-foreground">Recorded by {members.find((m)=>m.id===item.actor_id)?.name ?? "Former member"} · {formatDate(toClubDateString(item.changed_at))} {formatTime(item.changed_at)}</p></li>)}</ul></details>}
  </div>;
}
function clubTimeInput(value: string) { return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Tortola", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value)); }
function AttendanceForm({ slot, members, signups }: { slot: ProjectSlot; members: Member[]; signups: SlotSignup[] }) {
  const [ids,setIds]=useState(signups.map((r)=>r.member_id));
  const [result,setResult]=useState<SlotResult>();
  const [pending,start]=useTransition();
  return <details className="mt-4"><summary className="cursor-pointer font-semibold text-primary">Record attendance ({ids.length})</summary><form className="mt-4 space-y-3" onSubmit={(e)=>{e.preventDefault();const data=new FormData(e.currentTarget);const records=ids.map((id)=>({member_id:id,attendance:String(data.get(`status-${id}`)??""),hours:data.get(`hours-${id}`)===""?null:Number(data.get(`hours-${id}`))})).filter((r)=>r.attendance);if(!records.length){setResult({error:"Choose an attendance status for at least one member."});return;}start(async()=>{try{setResult(await recordProjectAttendance(slot.id,slot.revision,records));}catch{setResult({error:"Unable to save attendance. Refresh and try again."});}});}}>
    <p className="text-xs leading-6 text-muted-foreground">Present members receive the slot duration by default. Adjust hours for late arrival or early departure. Saving credits hours and one makeup per project day; corrections update both.</p>
    {ids.map((id)=>{const own=signups.find((r)=>r.member_id===id);return <fieldset key={id} className="rounded-xl border border-border p-3"><legend className="px-1 text-sm font-semibold">{members.find((m)=>m.id===id)?.name ?? "Former member"}{own?.status==="waitlisted"?" · waitlisted":""}</legend><div className="grid grid-cols-2 gap-2"><label className="text-xs">Attendance<select name={`status-${id}`} className={selectClass} defaultValue={own?.attendance??""}><option value="">Not recorded</option><option value="present">Present</option><option value="absent">Absent</option><option value="excused">Excused</option></select></label><label className="text-xs">Hours if present<Input name={`hours-${id}`} type="number" min="0.01" max="24" step="0.01" defaultValue={own?.attendance==="present"?own.credited_hours:duration(slot)} /></label></div></fieldset>;})}
    <label className="block text-sm">Add a walk-in<select className={selectClass} value="" onChange={(e)=>{if(e.target.value)setIds([...ids,e.target.value]);}}><option value="">Choose a member…</option>{members.filter((m)=>m.status!=="inactive"&&!ids.includes(m.id)).map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
    {result && <p role={result.error?"alert":"status"} className="text-sm">{result.error??result.success}</p>}<Button disabled={pending||ids.length===0} type="submit">{pending?"Saving…":"Save attendance & credits"}</Button>
  </form></details>;
}
