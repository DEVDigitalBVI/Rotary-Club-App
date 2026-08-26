-- A complete in-app notification system: member preferences, idempotent
-- delivery keys, realtime inbox updates, and trusted producers for the
-- app's main activity streams.

alter table notifications add column if not exists dedupe_key text;
create unique index if not exists notifications_recipient_dedupe_idx
  on notifications (recipient_id, dedupe_key) where dedupe_key is not null;

create table notification_preferences (
  member_id uuid primary key references members (id) on delete cascade,
  announcements boolean not null default true,
  events boolean not null default true,
  service boolean not null default true,
  chat boolean not null default true,
  administration boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table notification_preferences enable row level security;
create policy "notification_preferences_select" on notification_preferences
  for select to authenticated using (member_id = current_member_id());
create policy "notification_preferences_insert" on notification_preferences
  for insert to authenticated with check (member_id = current_member_id());
create policy "notification_preferences_update" on notification_preferences
  for update to authenticated
  using (member_id = current_member_id()) with check (member_id = current_member_id());

create or replace function notification_enabled(target_member_id uuid, notification_type text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when notification_type = 'announcement' then coalesce(p.announcements, true)
    when notification_type in ('event', 'event_waitlist') then coalesce(p.events, true)
    when notification_type in ('service', 'service_team') then coalesce(p.service, true)
    when notification_type = 'chat' then coalesce(p.chat, true)
    else coalesce(p.administration, true)
  end
  from (select 1) seed
  left join notification_preferences p on p.member_id = target_member_id;
$$;

create or replace function notify_secretary_of_makeup()
returns trigger language plpgsql security definer set search_path = public as $$
declare reporter_name text;
begin
  select name into reporter_name from members where id = new.member_id;
  insert into notifications (recipient_id, type, title, body, link, dedupe_key)
  select m.id, 'makeup_logged', 'Makeup to log in ClubRunner',
    coalesce(reporter_name, 'A member') || ' logged a makeup — '
      || new.club_or_event || ' on ' || to_char(new.attended_on, 'FMMon FMDD, YYYY'),
    '/account', 'makeup:' || new.id::text
  from members m
  where m.position in ('secretary', 'secretary-elect')
    and notification_enabled(m.id, 'makeup_logged')
  on conflict do nothing;
  return new;
end;
$$;

create or replace function notify_targeted_announcement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source <> 'club' then return new; end if;
  insert into notifications (recipient_id, type, title, body, link, dedupe_key)
  select m.id, 'announcement', new.title, left(new.body, 180), '/news',
    'announcement:' || new.id::text
  from members m
  where m.status = 'active' and m.id <> new.author_member_id
    and notification_enabled(m.id, 'announcement') and (
      new.audience_type = 'all'
      or (new.audience_type = 'board' and exists (
        select 1 from committee_members cm where cm.committee_id = 'board' and cm.member_id = m.id))
      or (new.audience_type = 'committee' and exists (
        select 1 from committee_members cm where cm.committee_id = new.audience_id and cm.member_id = m.id))
      or (new.audience_type = 'event' and exists (
        select 1 from event_rsvps er where er.event_id::text = new.audience_id
          and er.member_id = m.id and er.status in ('yes', 'maybe')))
    )
  on conflict do nothing;
  return new;
end;
$$;

create or replace function notify_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (recipient_id, type, title, body, link, dedupe_key)
  select recipient.id, 'chat', sender.name || ' mentioned you', left(new.body, 180),
    '/chat?channel=' || new.channel_id::text || '&message=' || new.id::text,
    'chat:' || new.id::text || ':mention:' || recipient.id::text
  from members recipient join members sender on sender.id = new.sender_id
  where recipient.id <> new.sender_id and recipient.status = 'active'
    and notification_enabled(recipient.id, 'chat')
    and can_member_access_chat_channel(recipient.id, new.channel_id)
    and lower(new.body) like '%@' || lower(recipient.name) || '%'
  on conflict do nothing;

  if new.reply_to_id is not null then
    insert into notifications (recipient_id, type, title, body, link, dedupe_key)
    select parent.sender_id, 'chat', sender.name || ' replied to you', left(new.body, 180),
      '/chat?channel=' || new.channel_id::text || '&message=' || new.id::text,
      'chat:' || new.id::text || ':reply:' || parent.sender_id::text
    from chat_messages parent join members sender on sender.id = new.sender_id
    where parent.id = new.reply_to_id and parent.sender_id <> new.sender_id
      and notification_enabled(parent.sender_id, 'chat')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create or replace function notify_new_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (recipient_id, type, title, body, link, dedupe_key)
  select m.id, 'event', 'New event: ' || new.title,
    to_char(new.starts_at at time zone 'America/Tortola', 'FMMon FMDD at FMHH12:MI AM')
      || case when new.location is not null then ' · ' || new.location else '' end,
    '/events/' || new.id::text, 'event:new:' || new.id::text
  from members m
  where m.status = 'active' and notification_enabled(m.id, 'event')
  on conflict do nothing;
  return new;
end;
$$;
create trigger events_notify_new after insert on events
  for each row execute function notify_new_event();

create or replace function notify_waitlisted_member()
returns trigger language plpgsql security definer set search_path = public as $$
declare event_title text;
begin
  if new.status <> 'yes' or new.registration_status <> 'waitlisted'
    or (tg_op = 'UPDATE' and old.registration_status = 'waitlisted') then return new; end if;
  select title into event_title from events where id = new.event_id;
  if notification_enabled(new.member_id, 'event_waitlist') then
    insert into notifications (recipient_id, type, title, body, link, dedupe_key)
    values (new.member_id, 'event_waitlist', 'You’re on the waitlist',
      coalesce(event_title, 'This event') || ' is currently full. We’ll keep your RSVP on the waitlist.',
      '/events/' || new.event_id::text, 'event:waitlist:' || new.event_id::text || ':' || new.member_id::text)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger event_rsvps_notify_waitlist after insert or update on event_rsvps
  for each row execute function notify_waitlisted_member();

create or replace function notify_open_service_project()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'open' or (tg_op = 'UPDATE' and old.status = 'open') then return new; end if;
  insert into notifications (recipient_id, type, title, body, link, dedupe_key)
  select m.id, 'service', 'New service opportunity', new.title, '/projects',
    'service:open:' || new.id::text
  from members m
  where m.status = 'active' and m.id is distinct from new.created_by
    and notification_enabled(m.id, 'service')
  on conflict do nothing;
  return new;
end;
$$;
create trigger service_projects_notify_open after insert or update on service_projects
  for each row execute function notify_open_service_project();

create or replace function notify_project_owner_of_volunteer()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid; project_title text; volunteer_name text;
begin
  select created_by, title into owner_id, project_title from service_projects where id = new.project_id;
  select name into volunteer_name from members where id = new.member_id;
  if owner_id is not null and owner_id <> new.member_id and notification_enabled(owner_id, 'service_team') then
    insert into notifications (recipient_id, type, title, body, link, dedupe_key)
    values (owner_id, 'service_team', coalesce(volunteer_name, 'A member') || ' joined your project',
      project_title, '/projects', 'service:join:' || new.project_id::text || ':' || new.member_id::text)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger project_volunteers_notify_owner after insert on project_volunteers
  for each row execute function notify_project_owner_of_volunteer();

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then alter publication supabase_realtime add table notifications; end if;
end $$;

notify pgrst, 'reload schema';
