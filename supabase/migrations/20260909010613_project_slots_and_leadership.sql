-- Project-scoped delegation and atomic signup/attendance credits.
alter table public.service_projects add column committee_id text not null default 'community-service' references public.committees(id);
create table public.project_leaders (
 project_id uuid not null references public.service_projects(id) on delete cascade,
 member_id uuid not null references public.members(id),
 role text not null check (role in ('lead','deputy')),
 primary key(project_id, role), unique(project_id, member_id)
);
create index project_leaders_member_idx on public.project_leaders(member_id);
create table public.project_slots (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.service_projects(id),
 title text not null check(char_length(trim(title)) between 1 and 150),
 starts_at timestamptz not null, ends_at timestamptz not null,
 signup_closes_at timestamptz not null, capacity integer not null check(capacity between 1 and 1000),
 location text, cancelled boolean not null default false, revision integer not null default 0,
 check(ends_at > starts_at and ends_at <= starts_at + interval '24 hours'),
 check(signup_closes_at <= starts_at)
);
create index project_slots_project_idx on public.project_slots(project_id, starts_at);
create table public.project_slot_signups (
 slot_id uuid not null references public.project_slots(id), member_id uuid not null references public.members(id),
 status text not null check(status in ('registered','waitlisted')),
 joined_at timestamptz not null default now(),
 attendance text check(attendance in ('present','absent','excused')),
 credited_hours numeric(6,2) not null default 0 check(credited_hours between 0 and 24),
 recorded_by uuid references public.members(id), recorded_at timestamptz,
 primary key(slot_id,member_id)
);
create index project_slot_signups_member_idx on public.project_slot_signups(member_id);
create table public.project_attendance_audit (
 id bigint generated always as identity primary key,
 slot_id uuid not null references public.project_slots(id), member_id uuid not null references public.members(id),
 actor_id uuid not null references public.members(id), changed_at timestamptz not null default now(),
 previous_state jsonb, next_state jsonb not null
);
create index project_attendance_audit_slot_idx on public.project_attendance_audit(slot_id,changed_at);
alter table public.volunteer_hours add column source_slot_id uuid references public.project_slots(id);
create unique index volunteer_hours_slot_member_idx on public.volunteer_hours(source_slot_id,member_id) where source_slot_id is not null;
alter table public.makeups add column source_project_id uuid references public.service_projects(id);
alter table public.makeups add column voided boolean not null default false;
create unique index makeups_project_day_idx on public.makeups(source_project_id,member_id,attended_on) where source_project_id is not null;

create or replace function app_private.can_assign_project(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select public.is_active_club_member() and exists (
 select 1 from public.service_projects p where p.id=p_project and
 (public.can_assign_roles() or public.can_manage_committee(p.committee_id)));
$$;
create or replace function app_private.can_run_project(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select public.is_active_club_member() and (app_private.can_assign_project(p_project) or exists (
 select 1 from public.project_leaders l join public.service_projects p on p.id=l.project_id
 join public.committee_members c on c.committee_id=p.committee_id and c.member_id=l.member_id
 where l.project_id=p_project and l.member_id=public.current_member_id()));
$$;

alter table public.project_leaders enable row level security;
alter table public.project_slots enable row level security;
alter table public.project_slot_signups enable row level security;
alter table public.project_attendance_audit enable row level security;
create policy leaders_read on public.project_leaders for select to authenticated using(public.is_active_club_member());
create policy slots_read on public.project_slots for select to authenticated using(public.is_active_club_member());
create policy signups_read on public.project_slot_signups for select to authenticated using(public.is_active_club_member() and (member_id=public.current_member_id() or exists(select 1 from public.project_slots s where s.id=slot_id and app_private.can_run_project(s.project_id))));
create policy audit_read on public.project_attendance_audit for select to authenticated using(exists(select 1 from public.project_slots s where s.id=slot_id and app_private.can_run_project(s.project_id)));
revoke all on public.project_leaders, public.project_slots, public.project_slot_signups, public.project_attendance_audit from anon, authenticated;
grant select on public.project_leaders, public.project_slots, public.project_slot_signups, public.project_attendance_audit to authenticated;
-- Hours for projects now come exclusively from attendance, not member self-entry.
revoke insert, update, delete on public.volunteer_hours from authenticated;
-- Linked makeups can only be generated/corrected by attendance. Officers may still mark ClubRunner entry.
drop policy if exists makeups_insert on public.makeups;
create policy makeups_insert on public.makeups for insert to authenticated with check(member_id=public.current_member_id() and source_project_id is null and not voided);
drop policy if exists makeups_delete on public.makeups;
create policy makeups_delete on public.makeups for delete to authenticated using(source_project_id is null and ((member_id=public.current_member_id() and not clubrunner_logged) or public.can_assign_roles()));
create function app_private.protect_project_makeup() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('authenticated','anon') and (old.source_project_id is not null or new.source_project_id is not null) and
 (new.member_id is distinct from old.member_id or new.attended_on is distinct from old.attended_on or new.source_project_id is distinct from old.source_project_id or new.voided is distinct from old.voided or new.club_or_event is distinct from old.club_or_event) then
 raise exception 'Project makeup credits are maintained through attendance'; end if;
 return new;
end; $$;
create trigger protect_project_makeup before update on public.makeups for each row execute function app_private.protect_project_makeup();

create function app_private.assign_project_team(p_project uuid,p_committee text,p_lead uuid,p_deputy uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.service_projects where id=p_project for update;
 if not app_private.can_assign_project(p_project) then raise exception 'Only club officers or the responsible committee director can assign project leaders'; end if;
 if p_committee is distinct from (select committee_id from public.service_projects where id=p_project) and not public.can_assign_roles() then raise exception 'Only club officers can change the responsible committee'; end if;
 if p_lead is not null and p_lead=p_deputy then raise exception 'Choose different members for lead and deputy'; end if;
 if not exists(select 1 from public.committees where id=p_committee and id <> 'board') then raise exception 'Choose a standing committee'; end if;
 if exists(select 1 from unnest(array[p_lead,p_deputy]) x where x is not null and not exists(select 1 from public.committee_members c join public.members m on m.id=c.member_id where c.member_id=x and c.committee_id=p_committee and m.status in ('active','honorary') and not m.is_superuser)) then raise exception 'Leaders must be active members of the responsible committee'; end if;
 update public.service_projects set committee_id=p_committee where id=p_project;
 delete from public.project_leaders where project_id=p_project;
 if p_lead is not null then insert into public.project_leaders values(p_project,p_lead,'lead'); end if;
 if p_deputy is not null then insert into public.project_leaders values(p_project,p_deputy,'deputy'); end if;
end; $$;

create function app_private.save_project_slot(p_project uuid,p_slot uuid,p_title text,p_start timestamptz,p_end timestamptz,p_cutoff timestamptz,p_capacity integer,p_location text)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 perform 1 from public.service_projects where id=p_project for update;
 if not app_private.can_run_project(p_project) then raise exception 'You cannot manage slots for this project'; end if;
 if (select status from public.service_projects where id=p_project) not in ('draft','open') then raise exception 'This project is closed'; end if;
 if p_start <= now() then raise exception 'Choose a future start time'; end if;
 if p_slot is null then
 insert into public.project_slots(project_id,title,starts_at,ends_at,signup_closes_at,capacity,location) values(p_project,trim(p_title),p_start,p_end,p_cutoff,p_capacity,p_location) returning id into result;
 else
 if not exists(select 1 from public.project_slots where id=p_slot and project_id=p_project and not cancelled) then raise exception 'Slot not found'; end if;
 if exists(select 1 from public.project_slot_signups where slot_id=p_slot) then raise exception 'A slot with signups cannot be edited; cancel it and create a replacement'; end if;
 update public.project_slots set title=trim(p_title),starts_at=p_start,ends_at=p_end,signup_closes_at=p_cutoff,capacity=p_capacity,location=p_location where id=p_slot returning id into result;
 end if;
 return result;
end; $$;

create function app_private.cancel_project_slot(p_slot uuid) returns void language plpgsql security definer set search_path='' as $$
declare project uuid;
begin
 select project_id into project from public.project_slots where id=p_slot;
 perform 1 from public.service_projects where id=project for update;
 if not app_private.can_run_project(project) then raise exception 'You cannot cancel this slot'; end if;
 if exists(select 1 from public.project_slot_signups where slot_id=p_slot and attendance is not null) then raise exception 'Correct recorded attendance before cancelling; attended slots must be retained'; end if;
 update public.project_slots set cancelled=true,revision=revision+1 where id=p_slot;
 insert into public.notifications(recipient_id,type,title,body,link) select member_id,'service','Service slot cancelled',s.title,'/projects/'||s.project_id from public.project_slot_signups r join public.project_slots s on s.id=r.slot_id where r.slot_id=p_slot;
end; $$;

-- Every signup operation locks the project first, serializing capacity decisions.
create function app_private.change_project_signup(p_slot uuid,p_cancel boolean default false,p_previous uuid default null)
returns text language plpgsql security definer set search_path='' as $$
declare s public.project_slots; me uuid:=public.current_member_id(); project uuid; occupied integer; result text; promoted uuid;
begin
 if not public.is_active_club_member() then raise exception 'Active membership is required'; end if;
 select project_id into project from public.project_slots where id=p_slot;
 perform 1 from public.service_projects where id=project for update;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(me::text,0));
 select * into s from public.project_slots where id=p_slot;
 if s.id is null or s.cancelled or s.signup_closes_at <= now() or (select status from public.service_projects where id=project)<>'open' then raise exception 'Signups are closed for this slot'; end if;
 if exists(select 1 from public.project_slot_signups where slot_id=p_slot and member_id=me and attendance is not null) then raise exception 'Recorded attendance cannot be changed through signup'; end if;
 if p_previous is not null then
 if p_cancel or p_previous=p_slot or not exists(select 1 from public.project_slots old where old.id=p_previous and old.project_id=project and not old.cancelled and old.signup_closes_at>now()) then raise exception 'The previous slot can no longer be switched'; end if;
 if not exists(select 1 from public.project_slot_signups where slot_id=p_previous and member_id=me and attendance is null) then raise exception 'Previous signup not found'; end if;
 end if;
 if p_cancel then
 delete from public.project_slot_signups where slot_id=p_slot and member_id=me;
 result:='cancelled';
 else
 if exists(select 1 from public.project_slot_signups r join public.project_slots other on other.id=r.slot_id where r.member_id=me and r.slot_id<>p_slot and (p_previous is null or r.slot_id<>p_previous) and not other.cancelled and other.starts_at<s.ends_at and other.ends_at>s.starts_at) then raise exception 'You already chose an overlapping slot'; end if;
 if exists(select 1 from public.project_slot_signups where slot_id=p_slot and member_id=me) then return (select status from public.project_slot_signups where slot_id=p_slot and member_id=me); end if;
 select count(*) into occupied from public.project_slot_signups where slot_id=p_slot and status='registered';
 result:=case when occupied<s.capacity then 'registered' else 'waitlisted' end;
 if p_previous is not null and result='waitlisted' then raise exception 'The new slot is full; your original booking has been kept'; end if;
 insert into public.project_slot_signups(slot_id,member_id,status) values(p_slot,me,result);
 if p_previous is not null then delete from public.project_slot_signups where slot_id=p_previous and member_id=me; end if;
 end if;
 -- A freed place goes to the earliest waiting member, while signup is still open.
 if p_cancel or p_previous is not null then
 select member_id into promoted from public.project_slot_signups where slot_id=coalesce(p_previous,p_slot) and status='waitlisted' order by joined_at,member_id limit 1;
 if promoted is not null then
 update public.project_slot_signups set status='registered' where slot_id=coalesce(p_previous,p_slot) and member_id=promoted and (select count(*) from public.project_slot_signups where slot_id=coalesce(p_previous,p_slot) and status='registered')<(select capacity from public.project_slots where id=coalesce(p_previous,p_slot));
 if found then insert into public.notifications(recipient_id,type,title,body,link) values(promoted,'service','A service place is yours','You have moved off the waitlist.','/projects/'||project); end if;
 end if;
 end if;
 return result;
end; $$;

create function app_private.record_project_attendance(p_slot uuid,p_revision integer,p_records jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare s public.project_slots; project uuid; entry record; oldrow public.project_slot_signups; nextrow public.project_slot_signups; actor uuid:=public.current_member_id(); day date; credit numeric; present_on_day boolean;
begin
 select project_id into project from public.project_slots where id=p_slot;
 perform 1 from public.service_projects where id=project for update;
 select * into s from public.project_slots where id=p_slot for update;
 if not app_private.can_run_project(project) then raise exception 'Only the secretary, responsible director or assigned project leaders may record attendance'; end if;
 if s.cancelled or s.starts_at>now() then raise exception 'Attendance can only be recorded after the slot starts'; end if;
 if s.revision is distinct from p_revision then raise exception 'This roster changed. Refresh before saving again'; end if;
 if p_records is null or jsonb_typeof(p_records)<>'array' or jsonb_array_length(p_records)>1000 then raise exception 'Invalid roster'; end if;
 if exists(select 1 from jsonb_to_recordset(p_records) as x(member_id uuid) group by member_id having count(*)>1) then raise exception 'Duplicate member in roster'; end if;
 day:=(s.starts_at at time zone 'America/Tortola')::date;
 for entry in select * from jsonb_to_recordset(p_records) as x(member_id uuid,attendance text,hours numeric) loop
 if entry.attendance is null or entry.attendance not in ('present','absent','excused') then raise exception 'Choose an attendance status'; end if;
 if not exists(select 1 from public.members where id=entry.member_id and status in ('active','honorary') and not is_superuser) then raise exception 'Choose an active member'; end if;
 credit:=case when entry.attendance='present' then coalesce(entry.hours,round(extract(epoch from s.ends_at-s.starts_at)/3600,2)) else 0 end;
 if credit<0 or credit>24 or (entry.attendance='present' and credit=0) then raise exception 'Present members require between 0 and 24 service hours'; end if;
 select * into oldrow from public.project_slot_signups where slot_id=p_slot and member_id=entry.member_id;
 insert into public.project_slot_signups(slot_id,member_id,status,attendance,credited_hours,recorded_by,recorded_at)
 values(p_slot,entry.member_id,'registered',entry.attendance,credit,actor,now())
 on conflict(slot_id,member_id) do update set status=case when excluded.attendance='present' then 'registered' else project_slot_signups.status end,attendance=excluded.attendance,credited_hours=excluded.credited_hours,recorded_by=excluded.recorded_by,recorded_at=excluded.recorded_at
 returning * into nextrow;
 insert into public.project_attendance_audit(slot_id,member_id,actor_id,previous_state,next_state) values(p_slot,entry.member_id,actor,to_jsonb(oldrow),to_jsonb(nextrow));
 if entry.attendance='present' then
 insert into public.volunteer_hours(project_id,member_id,hours,served_on,note,source_slot_id) values(project,entry.member_id,credit,day,'Recorded from project attendance',p_slot)
 on conflict(source_slot_id,member_id) where source_slot_id is not null do update set hours=excluded.hours,served_on=excluded.served_on;
 else delete from public.volunteer_hours where source_slot_id=p_slot and member_id=entry.member_id; end if;
 select exists(select 1 from public.project_slot_signups r join public.project_slots sl on sl.id=r.slot_id where sl.project_id=project and (sl.starts_at at time zone 'America/Tortola')::date=day and r.member_id=entry.member_id and r.attendance='present') into present_on_day;
 if present_on_day then
 insert into public.makeups(member_id,attended_on,club_or_event,source_project_id) values(entry.member_id,day,(select title from public.service_projects where id=project),project)
 on conflict(source_project_id,member_id,attended_on) where source_project_id is not null do update set voided=false,clubrunner_logged=false,clubrunner_logged_at=null,clubrunner_logged_by=null where makeups.voided;
 else
 update public.makeups set voided=true,clubrunner_logged=false,clubrunner_logged_at=null,clubrunner_logged_by=null where source_project_id=project and member_id=entry.member_id and attended_on=day and not voided;
 end if;
 end loop;
 update public.project_slots set revision=revision+1 where id=p_slot;
end; $$;

create function public.assign_project_team(p_project uuid,p_committee text,p_lead uuid,p_deputy uuid) returns void language sql set search_path='' as $$ select app_private.assign_project_team(p_project,p_committee,p_lead,p_deputy); $$;
create function public.save_project_slot(p_project uuid,p_slot uuid,p_title text,p_start timestamptz,p_end timestamptz,p_cutoff timestamptz,p_capacity integer,p_location text) returns uuid language sql set search_path='' as $$ select app_private.save_project_slot(p_project,p_slot,p_title,p_start,p_end,p_cutoff,p_capacity,p_location); $$;
create function public.cancel_project_slot(p_slot uuid) returns void language sql set search_path='' as $$ select app_private.cancel_project_slot(p_slot); $$;
create function public.change_project_signup(p_slot uuid,p_cancel boolean default false,p_previous uuid default null) returns text language sql set search_path='' as $$ select app_private.change_project_signup(p_slot,p_cancel,p_previous); $$;
create function public.record_project_attendance(p_slot uuid,p_revision integer,p_records jsonb) returns void language sql set search_path='' as $$ select app_private.record_project_attendance(p_slot,p_revision,p_records); $$;

-- Safe aggregate counts; individual attendance remains private under RLS.
create function app_private.project_slot_counts(p_project uuid) returns table(slot_id uuid,registered bigint,waitlisted bigint) language sql stable security definer set search_path='' as $$
 select s.id,count(r.member_id) filter(where r.status='registered'),count(r.member_id) filter(where r.status='waitlisted') from public.project_slots s left join public.project_slot_signups r on r.slot_id=s.id where s.project_id=p_project and public.is_active_club_member() group by s.id;
$$;
create function public.project_slot_counts(p_project uuid) returns table(slot_id uuid,registered bigint,waitlisted bigint) language sql stable set search_path='' as $$ select * from app_private.project_slot_counts(p_project); $$;
create function public.project_permissions(p_project uuid) returns jsonb language sql stable set search_path='' as $$ select jsonb_build_object('canManage',app_private.can_run_project(p_project),'canAssign',app_private.can_assign_project(p_project)); $$;

-- Preserve compatibility with the existing service totals API, now without approval.
create or replace function public.get_project_approved_hours() returns table(project_id uuid,hours numeric) language sql stable security definer set search_path='' as $$
 select vh.project_id,sum(vh.hours) from public.volunteer_hours vh where public.is_active_club_member() group by vh.project_id;
$$;

-- Explicit grants: all mutations remain in narrowly checked database transactions.
revoke all on function app_private.can_assign_project(uuid),app_private.can_run_project(uuid),app_private.assign_project_team(uuid,text,uuid,uuid),app_private.save_project_slot(uuid,uuid,text,timestamptz,timestamptz,timestamptz,integer,text),app_private.cancel_project_slot(uuid),app_private.change_project_signup(uuid,boolean,uuid),app_private.record_project_attendance(uuid,integer,jsonb),app_private.project_slot_counts(uuid),app_private.protect_project_makeup() from public,anon,authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.can_assign_project(uuid),app_private.can_run_project(uuid),app_private.assign_project_team(uuid,text,uuid,uuid),app_private.save_project_slot(uuid,uuid,text,timestamptz,timestamptz,timestamptz,integer,text),app_private.cancel_project_slot(uuid),app_private.change_project_signup(uuid,boolean,uuid),app_private.record_project_attendance(uuid,integer,jsonb),app_private.project_slot_counts(uuid) to authenticated;
revoke all on function public.assign_project_team(uuid,text,uuid,uuid),public.save_project_slot(uuid,uuid,text,timestamptz,timestamptz,timestamptz,integer,text),public.cancel_project_slot(uuid),public.change_project_signup(uuid,boolean,uuid),public.record_project_attendance(uuid,integer,jsonb),public.project_slot_counts(uuid),public.project_permissions(uuid) from public,anon;
grant execute on function public.assign_project_team(uuid,text,uuid,uuid),public.save_project_slot(uuid,uuid,text,timestamptz,timestamptz,timestamptz,integer,text),public.cancel_project_slot(uuid),public.change_project_signup(uuid,boolean,uuid),public.record_project_attendance(uuid,integer,jsonb),public.project_slot_counts(uuid),public.project_permissions(uuid) to authenticated;
notify pgrst,'reload schema';

-- Only the checked assignment RPC may transfer the responsible committee.
create function app_private.protect_project_committee() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('authenticated','anon') and new.committee_id is distinct from old.committee_id then raise exception 'Use project leadership to change the responsible committee'; end if;
 return new;
end; $$;
revoke all on function app_private.protect_project_committee() from public,anon,authenticated;
create trigger protect_project_committee before update on public.service_projects for each row execute function app_private.protect_project_committee();

-- Participation summaries expose no individual attendance or credited hours.
-- Keep legacy project enrollments while new bookings come from actual slots.
create function app_private.project_participants() returns table(project_id uuid,member_id uuid) language sql stable security definer set search_path='' as $$
 select v.project_id,v.member_id from public.project_volunteers v where public.is_active_club_member()
 union
 select s.project_id,r.member_id from public.project_slot_signups r join public.project_slots s on s.id=r.slot_id
 where public.is_active_club_member() and not s.cancelled and r.status='registered';
$$;
create function public.project_participants() returns table(project_id uuid,member_id uuid) language sql stable set search_path='' as $$ select * from app_private.project_participants(); $$;
revoke all on function app_private.project_participants(),public.project_participants() from public,anon;
grant execute on function app_private.project_participants(),public.project_participants() to authenticated;
