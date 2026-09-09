// Run with PGLITE_MODULE pointing to a local @electric-sql/pglite module.
// Installs no dependencies and never connects to Supabase.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
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
async function as(who,sql,args=[]) {
 await db.exec(`set role authenticated`);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[who]]);
 try { return await db.query(sql,args); } finally { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
async function rejects(who,sql,args,pattern) { await assert.rejects(()=>as(who,sql,args),pattern); }
const event=(await db.query("insert into events(title,starts_at,capacity,allow_guests,waitlist_enabled) values('Test event',now()+interval '12 hours',3,true,true) returning id")).rows[0].id;
const rsvp=(who,status,guests=0)=>as(who,'select public.change_event_rsvp($1,$2,$3) as registration',[event,status,guests]);
assert.equal((await rsvp('member','yes',2)).rows[0].registration,'registered');
assert.equal((await rsvp('waiting','yes',1)).rows[0].registration,'waitlisted');
assert.equal((await rsvp('outsider','yes')).rows[0].registration,'waitlisted');
const queued=(await db.query('select waitlisted_at from event_rsvps where event_id=$1 and member_id=$2',[event,ids.waiting])).rows[0].waitlisted_at;
await rsvp('waiting','yes',1);
assert.equal(String((await db.query('select waitlisted_at from event_rsvps where event_id=$1 and member_id=$2',[event,ids.waiting])).rows[0].waitlisted_at),String(queued));
// One free seat cannot split the first party or let a later member jump ahead.
await rsvp('member','yes',1);
assert.equal((await db.query("select count(*) from event_rsvps where event_id=$1 and registration_status='waitlisted'",[event])).rows[0].count,2);
await rsvp('member','no');
assert.equal((await db.query("select count(*) from event_rsvps where event_id=$1 and status='yes' and registration_status='registered'",[event])).rows[0].count,2);
assert.equal((await db.query("select count(*) from notifications where dedupe_key like 'event:promoted:%'")).rows[0].count,2);
await rejects('member',"update event_rsvps set registration_status='registered' where event_id=$1",[event],/permission denied/);
await rejects('member','select app_private.deliver_event_reminders()',[],/permission denied/);
await db.query("insert into notification_preferences(member_id,events) values($1,false)",[ids.outsider]);
await db.query('select app_private.deliver_event_reminders()');
await db.query('select app_private.deliver_event_reminders()');
assert.equal((await db.query("select count(*) from notifications where dedupe_key like 'event:reminder:%'")).rows[0].count,1);
assert.equal((await db.query("select recipient_id from notifications where dedupe_key like 'event:reminder:%'")).rows[0].recipient_id,ids.waiting);
// Capacity increases promote; preference disables promotion notices too.
await rsvp('member','yes');
await db.query('update events set capacity=4 where id=$1',[event]);
assert.equal((await db.query('select registration_status from event_rsvps where event_id=$1 and member_id=$2',[event,ids.member])).rows[0].registration_status,'registered');
await db.query("update events set rsvp_deadline=current_date-1 where id=$1",[event]);
await rejects('lead','select public.change_event_rsvp($1,\'yes\')',[event],/deadline/);
await rsvp('member','no');
// Rescheduling generates a new reminder; cancellation and waitlist receive none.
await db.query("update events set starts_at=now()+interval '90 minutes' where id=$1",[event]);
await db.query('select app_private.deliver_event_reminders()');
await db.query('select app_private.deliver_event_reminders()');
assert.equal((await db.query("select count(*) from notifications where dedupe_key like 'event:reminder:%'")).rows[0].count,2);
await db.query("update events set starts_at=now()-interval '1 minute' where id=$1",[event]);
assert.equal((await db.query('select app_private.deliver_event_reminders() as n')).rows[0].n,0);
await rejects('member','select public.change_event_rsvp($1,\'yes\')',[event],/already started/);
console.log('Passed: capacity including guests, FIFO party promotion, queue stability, cancellation, capacity increase, deadline handling, direct-write denial, reminder permissions, preferences, retries, rescheduling and past events.');
await db.close();
