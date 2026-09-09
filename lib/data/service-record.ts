import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { todayDateString } from "@/lib/format";
import { buildServiceEntries, type HoursRecord, type AttendanceRecord, type ServiceMakeup } from "@/lib/service-record";

export async function getPersonalServiceRecord(memberId: string) {
  const db = await createClient();
  const today = todayDateString();
  async function allRows<T>(fetch: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
    const rows: T[] = [];
    for (let offset=0;;offset+=500) {
      const result = await fetch(offset,offset+499);
      throwOnSupabaseError(result.error,"Unable to load your service record");
      rows.push(...(result.data ?? []));
      if ((result.data?.length ?? 0)<500) return rows;
    }
  }
  const [hours, attendance, makeupRows] = await Promise.all([
    allRows<HoursRecord>((from,to)=>db.from("volunteer_hours")
      .select("id, served_on, hours, note, project_id, source_slot_id, service_projects(title)")
      .eq("member_id",memberId).lte("served_on",today).order("id").range(from,to).returns<HoursRecord[]>()),
    allRows<AttendanceRecord>((from,to)=>db.from("project_slot_signups")
      .select("slot_id, attendance, project_slots!inner(title, starts_at, project_id, service_projects(title))")
      .eq("member_id",memberId).not("attendance","is",null).lte("project_slots.starts_at",new Date().toISOString())
      .order("slot_id").range(from,to).returns<AttendanceRecord[]>()),
    allRows<{id:string;attended_on:string;club_or_event:string;source_project_id:string|null;voided:boolean;clubrunner_logged:boolean}>((from,to)=>db.from("makeups")
      .select("id, attended_on, club_or_event, source_project_id, voided, clubrunner_logged")
      .eq("member_id",memberId).lte("attended_on",today).order("id").range(from,to)),
  ]);
  const makeups: ServiceMakeup[] = makeupRows.map(row=>({id:row.id,date:row.attended_on,title:row.club_or_event,projectId:row.source_project_id,voided:row.voided,logged:row.clubrunner_logged})).sort((a,b)=>b.date.localeCompare(a.date));
  return { entries: buildServiceEntries(hours,attendance), makeups, today };
}

/** Directory contribution history uses only fields already visible to club members. */
export async function getMemberServiceHistory(memberId: string) {
  const db = await createClient();
  const today = todayDateString();
  type Row = Omit<HoursRecord,"note"> & { project_slots: { title: string } | null };
  const rows: Row[] = [];
  for (let offset=0;;offset+=500) {
    const {data,error} = await db.from("volunteer_hours")
      .select("id, served_on, hours, project_id, source_slot_id, service_projects(title), project_slots(title)")
      .eq("member_id",memberId).lte("served_on",today).order("id").range(offset,offset+499).returns<Row[]>();
    throwOnSupabaseError(error,"Unable to load member service history");
    rows.push(...(data ?? []));
    if ((data?.length ?? 0)<500) break;
  }
  const slotTitles = new Map(rows.map(row=>[row.id,row.project_slots?.title ?? null]));
  return {today, entries: buildServiceEntries(rows.map(row=>({...row,note:null})),[]).map(entry=>({
    ...entry, slot: slotTitles.get(entry.id) ?? null,
  }))};
}
