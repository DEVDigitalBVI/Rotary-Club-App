import { rotaryYear } from "@/lib/my-rotary";
import { toClubDateString } from "@/lib/format";

export type ServiceEntry = { id: string; date: string; projectId: string; project: string; slot: string | null; hours: number; attendance: "present" | "absent" | "excused" | "legacy"; note: string | null };
export type ServiceMakeup = { id: string; date: string; title: string; projectId: string | null; voided: boolean; logged: boolean };
export type HoursRecord = { id: string; served_on: string; hours: number | string; note: string | null; project_id: string; source_slot_id: string | null; service_projects: { title: string } | null };
export type AttendanceRecord = { slot_id: string; attendance: "present" | "absent" | "excused"; project_slots: { title: string; starts_at: string; project_id: string; service_projects: { title: string } | null } };

export function buildServiceEntries(hours: HoursRecord[], attendance: AttendanceRecord[]): ServiceEntry[] {
  const slots = new Map(attendance.map(row => [row.slot_id, row]));
  const credited = new Set(hours.flatMap(row => row.source_slot_id ? [row.source_slot_id] : []));
  const entries: ServiceEntry[] = hours.map(row => ({
    id: row.id, date: row.served_on, projectId: row.project_id,
    project: row.service_projects?.title ?? "Service project", hours: Number(row.hours),
    slot: row.source_slot_id ? slots.get(row.source_slot_id)?.project_slots.title ?? null : null,
    attendance: row.source_slot_id ? slots.get(row.source_slot_id)?.attendance ?? "present" : "legacy",
    note: row.note,
  }));
  for (const row of attendance) if (!credited.has(row.slot_id)) entries.push({
    id: `slot-${row.slot_id}`, date: toClubDateString(row.project_slots.starts_at), projectId: row.project_slots.project_id,
    project: row.project_slots.service_projects?.title ?? "Service project", slot: row.project_slots.title,
    attendance: row.attendance, hours: 0, note: null,
  });
  return entries.sort((a,b) => b.date.localeCompare(a.date) || a.project.localeCompare(b.project) || a.id.localeCompare(b.id));
}

export function serviceTotals(entries: ServiceEntry[], makeups: ServiceMakeup[]) {
  return { hours: Math.round(entries.reduce((sum,row) => sum+row.hours,0)*100)/100,
    projects: new Set(entries.filter(row=>row.hours>0 || row.attendance==="present").map(row=>row.projectId)).size,
    attendances: entries.filter(row=>row.attendance==="present").length,
    makeups: makeups.filter(row=>!row.voided).length };
}
export function recordYears(entries: ServiceEntry[], makeups: ServiceMakeup[], today: string) {
  return [...new Set([rotaryYear(today).start,...entries.map(row=>rotaryYear(row.date).start),...makeups.map(row=>rotaryYear(row.date).start)])].sort().reverse();
}

// Quote every field and neutralize spreadsheet formulas in member-visible text.
const cell = (value: string | number) => `"${String(value).replace(/^[\s]*[=+@-]/, "'$&").replaceAll('"','""')}"`;
export function serviceRecordCsv(entries: ServiceEntry[], makeups: ServiceMakeup[]) {
  const rows: (string | number)[][] = [["Date","Type","Project or event","Slot","Hours","Status","Note"]];
  for (const row of entries) rows.push([row.date,"Service",row.project,row.slot ?? "",row.hours,row.attendance,row.note ?? ""]);
  for (const row of makeups) rows.push([row.date,"Meeting makeup",row.title,"","",row.voided ? "Removed" : row.logged ? "Logged in ClubRunner" : "Pending ClubRunner entry",""]);
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
