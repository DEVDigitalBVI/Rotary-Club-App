-- Event writes serialize on the event row. Queue order survives RSVP edits.
alter table public.event_rsvps add column waitlisted_at timestamptz;
update public.event_rsvps set waitlisted_at=responded_at where status='yes' and registration_status='waitlisted';
create index event_waitlist_order_idx on public.event_rsvps(event_id,waitlisted_at,member_id) where status='yes' and registration_status='waitlisted';
revoke insert,update,delete on public.event_rsvps from authenticated;
drop trigger event_rsvps_enforce_rules on public.event_rsvps;

create function app_private.promote_event_waitlist(p_event uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare e public.events; r record; occupied integer; promoted integer:=0;
begin
 select * into e from public.events where id=p_event for update;
 if e.id is null or e.starts_at<=now() then return 0; end if;
 select coalesce(sum(1+guest_count),0) into occupied from public.event_rsvps where event_id=p_event and status='yes' and registration_status='registered';
 for r in select er.* from public.event_rsvps er join public.members m on m.id=er.member_id
   where er.event_id=p_event and er.status='yes' and er.registration_status='waitlisted'
   and m.status in ('active','honorary') and not m.is_superuser
   order by er.waitlisted_at,er.member_id for update of er loop
   -- Keep a member and their guests together; never jump the oldest booking.
   if e.capacity is not null and occupied+1+r.guest_count>e.capacity then exit; end if;
   update public.event_rsvps set registration_status='registered',waitlisted_at=null where event_id=p_event and member_id=r.member_id;
   occupied:=occupied+1+r.guest_count; promoted:=promoted+1;
   if public.notification_enabled(r.member_id,'event') then
     insert into public.notifications(recipient_id,type,title,body,link,dedupe_key)
     values(r.member_id,'event_waitlist','Your place is confirmed',e.title||' now has space for you'||case when r.guest_count>0 then ' and your guests' else '' end||'.','/events/'||p_event,
       'event:promoted:'||p_event||':'||r.member_id||':'||r.waitlisted_at)
     on conflict do nothing;
   end if;
 end loop;
 return promoted;
end; $$;
revoke all on function app_private.promote_event_waitlist(uuid) from public,anon,authenticated;

create function app_private.change_event_rsvp(p_event uuid,p_status text,p_guests integer,p_dietary text) returns text
language plpgsql security definer set search_path='' as $$
declare e public.events; me uuid:=public.current_member_id(); previous public.event_rsvps; occupied integer; registration text:='registered'; queued_at timestamptz;
begin
 if not public.is_active_club_member() then raise exception 'Active membership is required'; end if;
 if p_status is null or p_status not in ('yes','no','maybe') or p_guests is null or p_guests<0 or p_guests>10 then raise exception 'Choose a valid RSVP and guest count'; end if;
 select * into e from public.events where id=p_event for update;
 if e.id is null then raise exception 'Event not found'; end if;
 if e.starts_at<=now() then raise exception 'This event has already started'; end if;
 select * into previous from public.event_rsvps where event_id=p_event and member_id=me;
 -- Cancellations remain possible after the deadline so seats can be released.
 if p_status<>'no' and e.rsvp_deadline is not null and e.rsvp_deadline<(now() at time zone 'America/Tortola')::date then raise exception 'The RSVP deadline has passed'; end if;
 if p_status<>'yes' or not e.allow_guests then p_guests:=0; end if;
 if p_status<>'yes' or not e.dietary_notes_enabled then p_dietary:=null; end if;
 if length(p_dietary)>2000 then raise exception 'Dietary notes must be 2000 characters or fewer'; end if;
 if p_status='yes' then
   select coalesce(sum(1+guest_count),0) into occupied from public.event_rsvps where event_id=p_event and member_id<>me and status='yes' and registration_status='registered';
   if (e.capacity is not null and occupied+1+p_guests>e.capacity)
      or (not (coalesce(previous.status='yes' and previous.registration_status='registered',false)) and exists(select 1 from public.event_rsvps r join public.members m on m.id=r.member_id where r.event_id=p_event and r.status='yes' and r.registration_status='waitlisted' and m.status in ('active','honorary') and not m.is_superuser)) then
     if not e.waitlist_enabled and previous.registration_status is distinct from 'waitlisted' then raise exception 'This event is full'; end if;
     registration:='waitlisted';
     queued_at:=case when previous.status='yes' and previous.registration_status='waitlisted' then previous.waitlisted_at else clock_timestamp() end;
   end if;
 end if;
 insert into public.event_rsvps(event_id,member_id,status,guest_count,dietary_notes,registration_status,waitlisted_at,responded_at)
 values(p_event,me,p_status,p_guests,nullif(trim(p_dietary),''),registration,queued_at,now())
 on conflict(event_id,member_id) do update set status=excluded.status,guest_count=excluded.guest_count,dietary_notes=excluded.dietary_notes,registration_status=excluded.registration_status,waitlisted_at=excluded.waitlisted_at,responded_at=excluded.responded_at;
 perform app_private.promote_event_waitlist(p_event);
 return (select registration_status from public.event_rsvps where event_id=p_event and member_id=me);
end; $$;
create function public.change_event_rsvp(p_event uuid,p_status text,p_guests integer default 0,p_dietary text default null) returns text language sql set search_path='' as $$ select app_private.change_event_rsvp(p_event,p_status,p_guests,p_dietary); $$;
revoke all on function app_private.change_event_rsvp(uuid,text,integer,text),public.change_event_rsvp(uuid,text,integer,text) from public,anon;
grant execute on function app_private.change_event_rsvp(uuid,text,integer,text),public.change_event_rsvp(uuid,text,integer,text) to authenticated;

create function app_private.event_capacity_promotions() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform app_private.promote_event_waitlist(new.id); return new;
end; $$;
revoke all on function app_private.event_capacity_promotions() from public,anon,authenticated;
create trigger events_promote_waitlist after update of capacity on public.events for each row execute function app_private.event_capacity_promotions();

-- Called by the database scheduler, never by members. Stable keys make retries safe.
create function app_private.deliver_event_reminders() returns integer language plpgsql security definer set search_path='' as $$
declare delivered integer; target uuid;
begin
 -- Also recover available places in existing queues or after administrative deletes.
 for target in select e.id from public.events e where e.starts_at>now() and exists(select 1 from public.event_rsvps r where r.event_id=e.id and r.status='yes' and r.registration_status='waitlisted') order by e.id loop
   perform app_private.promote_event_waitlist(target);
 end loop;
 insert into public.notifications(recipient_id,type,title,body,link,dedupe_key)
 select r.member_id,'event',case when e.starts_at>now()+interval '2 hours' then 'Upcoming event' else 'Event starting soon' end,
 e.title||' · '||to_char(e.starts_at at time zone 'America/Tortola','FMMon FMDD at FMHH12:MI AM')||coalesce(' · '||e.location,''),
 '/events/'||e.id,'event:reminder:'||e.id||':'||extract(epoch from e.starts_at)::text||':'||case when e.starts_at>now()+interval '2 hours' then '24h' else '2h' end
 from public.events e join public.event_rsvps r on r.event_id=e.id join public.members m on m.id=r.member_id
 where e.starts_at>now() and e.starts_at<=now()+interval '24 hours' and r.status='yes' and r.registration_status='registered'
 and m.status in ('active','honorary') and not m.is_superuser and public.notification_enabled(r.member_id,'event')
 on conflict do nothing;
 get diagnostics delivered=row_count; return delivered;
end; $$;
revoke all on function app_private.deliver_event_reminders() from public,anon,authenticated;

-- pg_cron is available on Supabase. Isolated test runtimes exercise the worker directly.
do $$ begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') then
   create extension if not exists pg_cron;
   perform cron.schedule('rotary-event-reminders','*/5 * * * *','select app_private.deliver_event_reminders()');
 end if;
end; $$;
notify pgrst,'reload schema';
