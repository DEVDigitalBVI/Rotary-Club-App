-- Attendance tracking: bylaws require 50% meeting attendance per Rotary
-- year (July 1 - June 30). Meetings are marked present/absent by the
-- Secretary (or another officer as backup, via can_assign_roles()); members
-- can self-log "makeup" attendance at other Rotary events. This app fronts
-- ClubRunner rather than replacing it, so a logged makeup doesn't try to
-- sync anywhere — it notifies the Secretary in-app to key it into
-- ClubRunner by hand.

alter table events add column counts_toward_attendance boolean not null default true;

-- Presence is row existence, same convention as committee_members/event_rsvps
-- — no separate boolean needed.
create table event_attendance (
  event_id uuid not null references events (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  marked_at timestamptz not null default now(),
  marked_by uuid references members (id) on delete set null,
  primary key (event_id, member_id)
);

create index event_attendance_member_id_idx on event_attendance (member_id);

alter table event_attendance enable row level security;

create policy "event_attendance_select" on event_attendance for select to authenticated using (true);
create policy "event_attendance_insert" on event_attendance for insert to authenticated
  with check (can_assign_roles());
create policy "event_attendance_delete" on event_attendance for delete to authenticated
  using (can_assign_roles());

create table makeups (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  attended_on date not null,
  club_or_event text not null,
  notes text,
  clubrunner_logged boolean not null default false,
  clubrunner_logged_at timestamptz,
  clubrunner_logged_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

create index makeups_member_id_idx on makeups (member_id);
create index makeups_pending_idx on makeups (clubrunner_logged) where not clubrunner_logged;

alter table makeups enable row level security;

create policy "makeups_select" on makeups for select to authenticated
  using (member_id = current_member_id() or can_assign_roles());
create policy "makeups_insert" on makeups for insert to authenticated
  with check (member_id = current_member_id());
create policy "makeups_update" on makeups for update to authenticated
  using (can_assign_roles())
  with check (can_assign_roles());
create policy "makeups_delete" on makeups for delete to authenticated
  using ((member_id = current_member_id() and not clubrunner_logged) or can_assign_roles());

-- makeups_insert's `with check` only restricts which row (own member_id),
-- not which columns — without this, a member could insert their own makeup
-- pre-marked clubrunner_logged = true, skipping the Secretary's
-- confirmation entirely. Same column-level gap pattern as the members
-- table; closed the same way, by force rather than trust.
create or replace function enforce_makeup_insert_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.clubrunner_logged := false;
    new.clubrunner_logged_at := null;
    new.clubrunner_logged_by := null;
  end if;
  return new;
end;
$$;

create trigger makeups_enforce_insert_defaults
  before insert on makeups
  for each row
  execute function enforce_makeup_insert_defaults();

-- Generic notification inbox — reusable for other notification types later
-- (e.g. chat mentions), not attendance-specific. Deliberately has no insert
-- policy for `authenticated`: rows are only ever created by trusted
-- server-side logic (the trigger below), never a direct client write, so
-- nobody can spam another member with a fake notification.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references members (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_unread_idx on notifications (recipient_id) where read_at is null;
create index notifications_recipient_created_idx on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "notifications_select" on notifications for select to authenticated
  using (recipient_id = current_member_id());
create policy "notifications_update" on notifications for update to authenticated
  using (recipient_id = current_member_id())
  with check (recipient_id = current_member_id());

-- security definer so it can insert into notifications despite there being
-- no insert policy for `authenticated` — the one sanctioned way rows land
-- in that table.
create or replace function notify_secretary_of_makeup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reporter_name text;
begin
  select name into reporter_name from members where id = new.member_id;

  insert into notifications (recipient_id, type, title, body, link)
  select
    m.id,
    'makeup_logged',
    'Makeup to log in ClubRunner',
    coalesce(reporter_name, 'A member') || ' logged a makeup - '
      || new.club_or_event || ' on ' || to_char(new.attended_on, 'FMMon FMDD, YYYY'),
    '/account'
  from members m
  where m.position in ('secretary', 'secretary-elect');

  return new;
end;
$$;

create trigger makeups_notify_secretary
  after insert on makeups
  for each row
  execute function notify_secretary_of_makeup();
