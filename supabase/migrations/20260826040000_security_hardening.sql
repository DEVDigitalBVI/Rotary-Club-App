-- Security hardening from the full Supabase audit.

-- RSVP directory data remains useful to members, but dietary notes are
-- private to the registrant and club officers. Remove broad table SELECT and
-- expose the safe shape through a narrowly authorized RPC.
revoke select on table event_rsvps from anon, authenticated;
grant select (event_id, member_id, status, responded_at, guest_count, registration_status)
  on table event_rsvps to authenticated;

create or replace function get_visible_event_rsvps(target_event_id uuid default null)
returns table (
  event_id uuid,
  member_id uuid,
  status text,
  guest_count integer,
  dietary_notes text,
  registration_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_id, r.member_id, r.status, r.guest_count,
    case
      when r.member_id = current_member_id() or runs_the_club() then r.dietary_notes
      else null
    end,
    r.registration_status
  from event_rsvps r
  where is_active_club_member()
    and (target_event_id is null or r.event_id = target_event_id);
$$;
revoke all on function get_visible_event_rsvps(uuid) from public, anon;
grant execute on function get_visible_event_rsvps(uuid) to authenticated;

-- Recalculate RSVP-derived fields inside the same transaction as the write.
-- Locking the event serializes competing registrations at the capacity edge.
create or replace function enforce_event_rsvp_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_event events;
  occupied integer;
begin
  if auth.uid() is null then return new; end if;

  select * into target_event from events where id = new.event_id for update;
  if target_event is null then raise exception 'event not found'; end if;
  if target_event.rsvp_deadline is not null and target_event.rsvp_deadline < current_date then
    raise exception 'the RSVP deadline has passed';
  end if;

  if new.status <> 'yes' then
    new.guest_count := 0;
    new.dietary_notes := null;
    new.registration_status := 'registered';
    return new;
  end if;

  if not target_event.allow_guests then new.guest_count := 0; end if;
  if not target_event.dietary_notes_enabled then new.dietary_notes := null; end if;

  select coalesce(sum(1 + r.guest_count), 0)::integer into occupied
  from event_rsvps r
  where r.event_id = new.event_id
    and r.member_id <> new.member_id
    and r.status = 'yes'
    and r.registration_status = 'registered';

  if target_event.capacity is not null
    and occupied + 1 + new.guest_count > target_event.capacity then
    if target_event.waitlist_enabled then
      new.registration_status := 'waitlisted';
    else
      raise exception 'event capacity has been reached';
    end if;
  else
    new.registration_status := 'registered';
  end if;
  return new;
end;
$$;

drop trigger if exists event_rsvps_enforce_rules on event_rsvps;
create trigger event_rsvps_enforce_rules
  before insert or update on event_rsvps
  for each row execute function enforce_event_rsvp_rules();

create or replace function enforce_project_volunteer_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not exists (
    select 1 from service_projects p where p.id = new.project_id and p.status = 'open'
  ) then
    raise exception 'members can only join open projects';
  end if;
  return new;
end;
$$;

drop trigger if exists project_volunteers_enforce_rules on project_volunteers;
create trigger project_volunteers_enforce_rules
  before insert or update on project_volunteers
  for each row execute function enforce_project_volunteer_rules();

-- Notification recipients may acknowledge a notification, but cannot rewrite
-- its trusted producer, message, destination, or delivery identity.
create or replace function enforce_notification_read_only_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and (
    new.id is distinct from old.id
    or new.recipient_id is distinct from old.recipient_id
    or new.type is distinct from old.type
    or new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.link is distinct from old.link
    or new.created_at is distinct from old.created_at
    or new.dedupe_key is distinct from old.dedupe_key
  ) then
    raise exception 'only notification read status may be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_read_only_update on notifications;
create trigger notifications_read_only_update
  before update on notifications
  for each row execute function enforce_notification_read_only_update();

-- Public-schema functions receive EXECUTE broadly by default. Internal
-- helpers are trigger-only; user-facing RPCs are granted deliberately.
revoke all on function can_member_access_chat_channel(uuid, uuid) from public, anon, authenticated;
revoke all on function notification_enabled(uuid, text) from public, anon, authenticated;

revoke all on function can_access_chat_channel(uuid) from public, anon;
grant execute on function can_access_chat_channel(uuid) to authenticated;

revoke all on function get_or_create_direct_chat(uuid) from public, anon;
grant execute on function get_or_create_direct_chat(uuid) to authenticated;

revoke all on function search_chat_messages(text) from public, anon;
grant execute on function search_chat_messages(text) to authenticated;

revoke all on function get_recent_chat_messages(integer) from public, anon;
grant execute on function get_recent_chat_messages(integer) to authenticated;

revoke all on function delete_owned_direct_chat(uuid) from public, anon;
grant execute on function delete_owned_direct_chat(uuid) to authenticated;

notify pgrst, 'reload schema';
