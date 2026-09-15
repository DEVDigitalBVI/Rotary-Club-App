"use client";
import { useState } from "react";
import { loadProjectAttendanceHistory } from "@/app/(app)/projects/slot-actions";
import type { AttendanceAudit } from "@/lib/data/project-slots";
import type { Member } from "@/lib/club";
import { formatDateTime } from "@/lib/format";
export function AttendanceHistory({ projectId, members }: { projectId: string; members: Member[] }) {
  const [rows, setRows] = useState<AttendanceAudit[] | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function load() { setBusy(true); setError(""); try { setRows(await loadProjectAttendanceHistory(projectId)); } catch { setError("Unable to load attendance history. Close and reopen to retry."); } finally { setBusy(false); } }
  return <details className="rounded-2xl border border-border p-5" onToggle={e => { if (e.currentTarget.open && !rows && !busy) void load(); }}><summary className="cursor-pointer font-semibold">Attendance history · latest 30 changes</summary>{busy&&<p role="status" className="mt-3 text-sm">Loading history…</p>}{error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<ul className="mt-4 divide-y divide-border">{rows?.map(row=><li key={row.id} className="py-3 text-sm"><strong>{members.find(member=>member.id===row.member_id)?.name??"Member"}</strong> · {row.previous_state?.attendance??"Unrecorded"} → {row.next_state.attendance} · {row.next_state.credited_hours} hrs<p className="mt-1 text-xs text-muted-foreground">Recorded by {members.find(member=>member.id===row.actor_id)?.name??"Former member"} · {formatDateTime(row.changed_at)}</p></li>)}</ul>{rows?.length===0&&<p className="text-sm text-muted-foreground">No attendance changes recorded.</p>}</details>;
}
