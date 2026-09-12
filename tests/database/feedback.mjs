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
async function rejects(who,sql,args,pattern) { await assert.rejects(()=>as(who,sql,args),pattern); }
const feedback='10000000-0000-4000-8000-000000000001';
const args=[feedback,'idea','Weekend service','Please add more weekend service opportunities.'];
await as('member','select public.submit_member_feedback($1,$2,$3,$4)',args);
await as('member','select public.submit_member_feedback($1,$2,$3,$4)',args);
assert.equal((await db.query('select count(*) from member_feedback')).rows[0].count,1);
assert.equal((await as('outsider','select count(*) from member_feedback')).rows[0].count,0);
assert.equal((await as('member','select count(*) from member_feedback')).rows[0].count,1);
assert.equal((await as('secretary','select count(*) from member_feedback')).rows[0].count,1);
await rejects('member','select public.review_member_feedback($1,0,\'done\',\'Done\')',[feedback],/Only club officers/);
await rejects('member','update member_feedback set status=\'done\' where id=$1',[feedback],/permission denied/);
await as('secretary','select public.review_member_feedback($1,0,\'planned\',\'We will include this in the next programme.\')',[feedback]);
await rejects('secretary','select public.review_member_feedback($1,0,\'done\',\'Done\')',[feedback],/changed/);
assert.equal((await as('member','select response from member_feedback where id=$1',[feedback])).rows[0].response,'We will include this in the next programme.');
assert.equal((await db.query("select count(*) from notifications where dedupe_key like 'feedback:update:%'")).rows[0].count,1);
await as('secretary','select public.review_member_feedback($1,1,\'planned\',\'We will include this in the next programme.\')',[feedback]);
assert.equal((await db.query("select count(*) from notifications where dedupe_key like 'feedback:update:%'")).rows[0].count,1);
await rejects('member','select public.submit_member_feedback($1,\'idea\',\'ok\',\'short\')',['10000000-0000-4000-8000-000000000002'],/Choose a category/);
for(let i=2;i<=10;i++)await as('member','select public.submit_member_feedback($1,$2,$3,$4)',[`10000000-0000-4000-8000-${String(i).padStart(12,'0')}`,...args.slice(1)]);
await rejects('member','select public.submit_member_feedback($1,$2,$3,$4)',['10000000-0000-4000-8000-000000000011',...args.slice(1)],/10 submissions/);
await db.query("update members set status='inactive' where id=$1",[ids.member]);
assert.equal((await as('member','select count(*) from member_feedback')).rows[0].count,0);
console.log('Passed: private submissions, officer access, idempotent retries, input limits, daily limit, review authorization, stale review protection, response visibility, notification deduplication, inactive access.');
await db.close();
