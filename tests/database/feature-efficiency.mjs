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
const as = authenticatedQuery(db, ids);

await db.exec("set timezone='America/Tortola'");
const project='10000000-0000-4000-8000-000000000001';
const event='20000000-0000-4000-8000-000000000001';
await db.query("insert into service_projects(id,title,summary,status) values($1,'Service','Test','open')",[project]);
await db.query("insert into events(id,title,starts_at) values($1,'Meeting',now()+interval '1 day')",[event]);
await db.query("insert into event_rsvps(event_id,member_id,status,guest_count,registration_status) values($1,$2,'yes',2,'registered'),($1,$3,'yes',3,'waitlisted')",[event,ids.member,ids.waiting]);
const summary=(await as('member','select * from event_card_summaries(array[$1]::uuid[])',[event])).rows[0];
assert.equal(summary.yes_count,1);assert.equal(summary.waitlisted_count,1);assert.equal(summary.guest_count,2);assert.equal(summary.own_status,'yes');
await db.exec('set role anon');
await assert.rejects(()=>db.query('select * from event_card_summaries(array[$1]::uuid[])',[event]),/permission denied/);await db.exec('reset role');
await db.query("insert into volunteer_hours(project_id,member_id,hours,served_on) values($1,$2,2.5,current_date),($1,$2,7,current_date-interval '2 years'),($1,$2,9,current_date+interval '2 days')",[project,ids.member]);
const totalSql="select personal_service_total($1,date_trunc('year',current_date)::date,(date_trunc('year',current_date)+interval '1 year')::date,current_date) as total";
assert.equal(Number((await as('member',totalSql,[ids.member])).rows[0].total),2.5);
assert.equal(Number((await as('secretary',totalSql,[ids.member])).rows[0].total),0);
assert.equal((await as('member','select * from service_record_years($1)',[ids.member])).rows.length,2);
await db.query("insert into news_posts(title,body,source,author,published_at,priority) values('Normal','Test','club','Club',current_date,'normal'),('Urgent','Test','club','Club',current_date-1,'urgent')");
assert.equal((await as('member','select title from club_notice_page(1,0)')).rows[0].title,'Urgent');
await db.query("insert into news_posts(title,body,source,author,published_at,priority,expires_at) values('Expired','Test','club','Club',current_date,'urgent',current_date-1)");
assert.equal((await as('member','select count(*) from club_notice_page(100,0)')).rows[0].count,2);
const m1=(await db.query("insert into makeups(member_id,attended_on,club_or_event) values($1,current_date,'One') returning id",[ids.member])).rows[0].id;
const m2=(await db.query("insert into makeups(member_id,attended_on,club_or_event) values($1,current_date,'Two') returning id",[ids.member])).rows[0].id;
await assert.rejects(()=>as('member','select complete_makeup_batch($1)',[JSON.stringify([{id:m1,voided:false}])]),/Only club officers/);
await assert.rejects(()=>as('secretary','select complete_makeup_batch($1)',[JSON.stringify([{id:m1,voided:false},{id:m2,voided:true}])]),/list changed/);
assert.equal((await db.query('select count(*) from makeups where clubrunner_logged')).rows[0].count,0);
assert.equal((await as('secretary','select complete_makeup_batch($1) as changed',[JSON.stringify([{id:m1,voided:false},{id:m2,voided:false}])])).rows[0].changed,2);
assert.equal((await as('member','select count(*) from project_card_totals(array[$1]::uuid[])',[project])).rows[0].count,1);
// Payload comparison uses synthetic data, identical session and one event.
for(let i=0;i<48;i++){
 const id=`30000000-0000-4000-8000-${String(i).padStart(12,'0')}`;
 await db.query("insert into members(id,name,email,join_date) values($1,$2,$3,current_date)",[id,`Synthetic ${i}`,`synthetic${i}@example.test`]);
 await db.query("insert into event_rsvps(event_id,member_id,status,guest_count) values($1,$2,'yes',0)",[event,id]);
}
async function measure(sql,args){const start=performance.now();const result=await as('member',sql,args);return {rows:result.rows.length,bytes:Buffer.byteLength(JSON.stringify(result.rows)),milliseconds:Number((performance.now()-start).toFixed(2))};}
const before=await measure('select * from get_visible_event_rsvps($1)',[event]);
const after=await measure('select * from event_card_summaries(array[$1]::uuid[])',[event]);
console.log(JSON.stringify({environment:'isolated PGlite; synthetic 50-RSVP event; authenticated member; single cold sample',eventListPayload:{before,after}},null,2));
console.log('Passed: event summary parity, guest/waitlist counts, anonymous denial, self-only service totals, date bounds, service years, notice priority/expiry, atomic makeup batches and officer-only writes.');
await db.close();
