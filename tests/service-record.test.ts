import { describe, expect, it } from "vitest";
import { buildServiceEntries, recordYears, serviceRecordCsv, serviceTotals, type ServiceMakeup, type HoursRecord, type AttendanceRecord } from "../lib/service-record";
const hours: HoursRecord[] = [{id:"h",served_on:"2026-06-30",hours:"2.5",note:null,project_id:"p",source_slot_id:"s",service_projects:{title:"Project"}},{id:"old",served_on:"2026-07-01",hours:1,note:"Legacy",project_id:"p",source_slot_id:null,service_projects:{title:"Project"}}];
const attendance: AttendanceRecord[] = [{slot_id:"s",attendance:"present",project_slots:{title:"Morning",starts_at:"2026-07-01T02:00:00Z",project_id:"p",service_projects:{title:"Project"}}},{slot_id:"absent",attendance:"absent",project_slots:{title:"Afternoon",starts_at:"2026-07-01T18:00:00Z",project_id:"p",service_projects:{title:"Project"}}}];
const makeups: ServiceMakeup[]=[{id:"m",date:"2026-06-30",title:"Project",projectId:"p",voided:false,logged:false},{id:"removed",date:"2026-07-01",title:"Project",projectId:"p",voided:true,logged:true}];
describe("personal service record",()=>{
 it("merges hours with attendance without double counting and preserves absences",()=>{
  const rows=buildServiceEntries(hours,attendance);
  expect(rows).toHaveLength(3);
  expect(rows.find(row=>row.id==='h')).toMatchObject({slot:"Morning",hours:2.5,attendance:"present",date:"2026-06-30"});
  expect(serviceTotals(rows,makeups)).toEqual({hours:3.5,projects:1,attendances:1,makeups:1});
 });
 it("uses BVI dates and July year boundaries",()=>{
  const rows=buildServiceEntries([],attendance);
  expect(rows.find(row=>row.id==='slot-s')?.date).toBe('2026-06-30');
  expect(recordYears(rows,makeups,'2026-07-01')).toEqual(['2026-07-01','2025-07-01']);
 });
 it("exports quoted fields, neutralizes spreadsheet formulas and labels voided credits",()=>{
  const rows=buildServiceEntries(hours,attendance);rows[0].project='=HYPERLINK("unsafe")'; rows[0].note='one, two\nthree';
  const csv=serviceRecordCsv(rows,makeups);
  expect(csv).toContain('"\'=HYPERLINK(""unsafe"")"');
  expect(csv).toContain('"one, two\nthree"');expect(csv).toContain('"Removed"');
 });
 it("keeps an empty record useful and does not fabricate activity",()=>{
  expect(serviceTotals([],[])).toEqual({hours:0,projects:0,attendances:0,makeups:0});
  expect(recordYears([],[],'2026-01-01')).toEqual(['2025-07-01']);
 });
});
