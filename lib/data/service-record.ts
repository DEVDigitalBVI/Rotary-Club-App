import { rotaryYear } from "@/lib/my-rotary";
import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { todayDateString } from "@/lib/format";
import { buildServiceEntries, type HoursRecord, type AttendanceRecord, type ServiceMakeup } from "@/lib/service-record";

export async function getPersonalServiceRecord(memberId: string, selectedYear?: string | null) {
  const db = await createClient();
  const today = todayDateString();
  const year = selectedServiceYear(selectedYear, today);
  const bounds = year ? rotaryYear(year) : null;
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
      .eq("member_id",memberId).gte("served_on",bounds?.start ?? "0001-01-01").lt("served_on",bounds?.end ?? "9999-01-01").lte("served_on",today).order("id").range(from,to).returns<HoursRecord[]>()),
    allRows<AttendanceRecord>((from,to)=>db.from("project_slot_signups")
      .select("slot_id, attendance, project_slots!inner(title, starts_at, project_id, service_projects(title))")
      .eq("member_id",memberId).gte("project_slots.starts_at",`${bounds?.start ?? "0001-01-01"}T00:00:00-04:00`).lt("project_slots.starts_at",`${bounds?.end ?? "9999-01-01"}T00:00:00-04:00`).not("attendance","is",null).lte("project_slots.starts_at",new Date().toISOString())
      .order("slot_id").range(from,to).returns<AttendanceRecord[]>()),
    allRows<{id:string;attended_on:string;club_or_event:string;source_project_id:string|null;voided:boolean;clubrunner_logged:boolean}>((from,to)=>db.from("makeups")
      .select("id, attended_on, club_or_event, source_project_id, voided, clubrunner_logged")
      .eq("member_id",memberId).gte("attended_on",bounds?.start ?? "0001-01-01").lt("attended_on",bounds?.end ?? "9999-01-01").lte("attended_on",today).order("id").range(from,to)),
  ]);
  const makeups: ServiceMakeup[] = makeupRows.map(row=>({id:row.id,date:row.attended_on,title:row.club_or_event,projectId:row.source_project_id,voided:row.voided,logged:row.clubrunner_logged})).sort((a,b)=>b.date.localeCompare(a.date));
  return { entries: buildServiceEntries(hours,attendance), makeups, today, selectedYear: year ?? "all", years: selectedYear === null ? [] : await getServiceRecordYears(memberId) };
}

/** Directory contribution history uses only fields already visible to club members. */
export async function getMemberServiceHistory(memberId: string, selectedYear?: string) {
  const db = await createClient();
  const today = todayDateString();
  const year = selectedServiceYear(selectedYear, today);
  const bounds = year ? rotaryYear(year) : null;
  type Row = Omit<HoursRecord,"note"> & { project_slots: { title: string } | null };
  const rows: Row[] = [];
  for (let offset=0;;offset+=500) {
    const {data,error} = await db.from("volunteer_hours")
      .select("id, served_on, hours, project_id, source_slot_id, service_projects(title), project_slots(title)")
      .eq("member_id",memberId).gte("served_on",bounds?.start ?? "0001-01-01").lt("served_on",bounds?.end ?? "9999-01-01").lte("served_on",today).order("id").range(offset,offset+499).returns<Row[]>();
    throwOnSupabaseError(error,"Unable to load member service history");
    rows.push(...(data ?? []));
    if ((data?.length ?? 0)<500) break;
  }
  const slotTitles = new Map(rows.map(row=>[row.id,row.project_slots?.title ?? null]));
  return {today, selectedYear: year!, years: await getServiceRecordYears(memberId), entries: buildServiceEntries(rows.map(row=>({...row,note:null})),[]).map(entry=>({
    ...entry, slot: slotTitles.get(entry.id) ?? null,
  }))};
}

function selectedServiceYear(value: string | null | undefined, today: string) {
  if (value === null) return null; // Full history is reserved for explicit exports.
  return value && /^(19|20)\d{2}-07-01$/.test(value) ? value : rotaryYear(today).start;
}

async function getServiceRecordYears(memberId: string) {
  const db = await createClient();
  const { data, error } = await db.rpc("service_record_years", { p_member: memberId });
  throwOnSupabaseError(error, "Unable to load Rotary years");
  return ((data ?? []) as { year_start: string }[]).map(row => row.year_start);
}
