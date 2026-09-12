// Run with PGLITE_MODULE pointing to a local @electric-sql/pglite module.
// Installs no dependencies and never connects to Supabase.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { authenticatedQuery } from './helpers.mjs';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema storage;
create table auth.users(id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
alter table storage.objects enable row level security;
create publication supabase_realtime;
grant usage on schema public,auth,storage to authenticated,anon,service_role;
alter default privileges in schema public grant all on tables to authenticated,service_role;
alter default privileges in schema public grant all on sequences to authenticated,service_role;
`);
const migrationDir = path.resolve('supabase/migrations');
for (const name of fs.readdirSync(migrationDir).filter((n)=>n.endsWith('.sql')).sort()) {
  const sql = fs.readFileSync(path.join(migrationDir,name),'utf8').replace(/create extension if not exists "pgcrypto";/g,'');
  try { await db.exec(sql); } catch(error) { console.error('Migration failed:',name,error.message); process.exit(1); }
}
console.log('All repository migrations applied to isolated PostgreSQL.');
const ids = Object.fromEntries(['secretary','lead','member','waiting','outsider','project','other'].map((name,index)=>[name,`00000000-0000-4000-8000-${String(index+1).padStart(12,'0')}`]));
for (const role of ['secretary','lead','member','waiting','outsider']) {
 await db.query('insert into auth.users(id,email) values($1,$2)',[ids[role],`${role}@example.test`]);
 await db.query('insert into public.members(id,user_id,name,email,join_date,position) values($1,$1,$2,$3,current_date,$4)',[ids[role],role,`${role}@example.test`,role==='secretary'?'secretary':null]);
}
await db.query("insert into public.committee_members(committee_id,member_id) values('community-service',$1)",[ids.lead]);
for(const project of ['project','other']) await db.query("insert into public.service_projects(id,title,summary,starts_at,status) values($1,$2,'Test',now()+interval '1 day','open')",[ids[project],project]);
const as = authenticatedQuery(db, ids);
async function rejects(who,sql,args,pattern) { await assert.rejects(()=>as(who,sql,args),pattern); }
await as('secretary','select public.assign_project_team($1,$2,$3,null)',[ids.project,'community-service',ids.lead]);
assert.equal((await as('lead','select public.project_permissions($1) as p',[ids.project])).rows[0].p.canManage,true);
assert.equal((await as('lead','select public.project_permissions($1) as p',[ids.other])).rows[0].p.canManage,false);
await rejects('lead','select public.assign_project_team($1,$2,$3,null)',[ids.project,'community-service',ids.member],/Only club officers/);
await rejects('secretary','select public.assign_project_team($1,$2,$3,null)',[ids.project,'community-service',ids.outsider],/responsible committee/);
async function slot(start,end) {
 return (await as('lead',"select public.save_project_slot($1,null,'Packing',$2,$3,$2,1,'Clubhouse') as id",[ids.project,start,end])).rows[0].id;
}
const start=new Date(Date.now()+86400000).toISOString();
const end=new Date(Date.parse(start)+7200000).toISOString();
const slot1=await slot(start,end);
const slot2=await slot(new Date(Date.parse(end)+3600000).toISOString(),new Date(Date.parse(end)+7200000).toISOString());
await rejects('outsider','select public.record_project_attendance($1,0,$2)',[slot1,JSON.stringify([])],/Only the secretary/);
await as('member','select public.change_project_signup($1)',[slot1]);
assert.equal((await as('waiting','select public.change_project_signup($1) as status',[slot1])).rows[0].status,'waitlisted');
await rejects('member','insert into public.project_slot_signups(slot_id,member_id,status) values($1,$2,\'registered\')',[slot2,ids.member],/permission denied/);
await rejects('member','insert into public.volunteer_hours(project_id,member_id,hours,served_on) values($1,$2,2,current_date)',[ids.project,ids.member],/permission denied/);
await as('member','select public.change_project_signup($1,true)',[slot1]);
assert.equal((await db.query('select status from project_slot_signups where slot_id=$1 and member_id=$2',[slot1,ids.waiting])).rows[0].status,'registered');
await as('member','select public.change_project_signup($1)',[slot2]);
await rejects('member','select public.change_project_signup($1,false,$2)',[slot1,slot2],/original booking has been kept/);
assert.equal((await db.query('select count(*) from project_slot_signups where slot_id=$1 and member_id=$2',[slot2,ids.member])).rows[0].count,1);
const participants = (await as('member','select * from public.project_participants()')).rows;
assert.equal(participants.filter(row=>row.project_id===ids.project).length,2);
assert.ok(participants.every(row=>Object.keys(row).sort().join(',')==='member_id,project_id'));
// Move fixture slots into a single past BVI day as the test DB owner.
await db.query("update project_slots set starts_at=(current_date-1)+time '12:00',ends_at=(current_date-1)+time '14:00',signup_closes_at=(current_date-1)+time '12:00' where id=$1",[slot1]);
await db.query("update project_slots set starts_at=(current_date-1)+time '15:00',ends_at=(current_date-1)+time '16:00',signup_closes_at=(current_date-1)+time '15:00' where id=$1",[slot2]);
const records=(status,hours=null)=>JSON.stringify([{member_id:ids.member,attendance:status,hours}]);
await as('lead','select public.record_project_attendance($1,0,$2)',[slot1,records('present')]);
await as('lead','select public.record_project_attendance($1,0,$2)',[slot2,records('present')]);
assert.equal(Number((await db.query('select sum(hours) as n from volunteer_hours where member_id=$1',[ids.member])).rows[0].n),3);
assert.equal((await db.query('select count(*) from makeups where member_id=$1 and not voided',[ids.member])).rows[0].count,1);
await rejects('lead','select public.record_project_attendance($1,0,$2)',[slot1,records('present',1)],/roster changed/);
await as('lead','select public.record_project_attendance($1,1,$2)',[slot1,records('present',1.5)]);
assert.equal(Number((await db.query('select sum(hours) as n from volunteer_hours where member_id=$1',[ids.member])).rows[0].n),2.5);
await as('lead','select public.record_project_attendance($1,2,$2)',[slot1,records('absent')]);
assert.equal((await db.query('select count(*) from makeups where member_id=$1 and not voided',[ids.member])).rows[0].count,1);
await as('secretary','update public.makeups set clubrunner_logged=true where member_id=$1',[ids.member]);
await as('lead','select public.record_project_attendance($1,1,$2)',[slot2,records('excused')]);
const makeup=(await db.query('select voided,clubrunner_logged from makeups where member_id=$1',[ids.member])).rows[0];
assert.deepEqual(makeup,{voided:true,clubrunner_logged:false});
assert.equal((await db.query('select count(*) from volunteer_hours where member_id=$1',[ids.member])).rows[0].count,0);
assert.equal((await as('outsider','select count(*) from project_attendance_audit')).rows[0].count,0);
assert.equal((await as('lead','select count(*) from project_attendance_audit')).rows[0].count,5);
await rejects('secretary','update public.makeups set voided=false where member_id=$1',[ids.member],/maintained through attendance/);
await db.query('delete from committee_members where committee_id=\'community-service\' and member_id=$1',[ids.lead]);
assert.equal((await as('lead','select public.project_permissions($1) as p',[ids.project])).rows[0].p.canManage,false);
console.log('Passed: delegation isolation, eligibility, capacity, waitlist promotion, atomic switch, direct-write denial, attendance, default/adjusted hours, one makeup per day, stale roster rejection, corrections, audit privacy and revoked membership.');
await db.close();
