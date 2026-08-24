alter table events
  add column attendance_taken_at timestamptz,
  add column attendance_taken_by uuid references members (id) on delete set null;

-- Replace the complete attendance roster in one database transaction. The
-- existing state is read here rather than trusted from a browser snapshot.
create or replace function set_event_attendance(
  target_event_id uuid,
  attendee_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  attendee_id uuid;
begin
  if not can_assign_roles() then
    raise exception 'not permitted';
  end if;

  if not exists (select 1 from events where id = target_event_id) then
    raise exception 'event not found';
  end if;

  delete from event_attendance where event_id = target_event_id;

  foreach attendee_id in array coalesce(attendee_ids, '{}'::uuid[])
  loop
    insert into event_attendance (event_id, member_id, marked_by)
    select target_event_id, m.id, current_member_id()
    from members m
    where m.id = attendee_id and m.status in ('active', 'honorary')
    on conflict do nothing;
  end loop;

  update events
  set attendance_taken_at = now(),
      attendance_taken_by = current_member_id(),
      attendance_present = (
        select count(*)::integer
        from event_attendance
        where event_id = target_event_id
      ),
      attendance_total = (
        select count(*)::integer from members where status in ('active', 'honorary')
      )
  where id = target_event_id;
end;
$$;

revoke all on function set_event_attendance(uuid, uuid[]) from public;
revoke execute on function set_event_attendance(uuid, uuid[]) from anon;
grant execute on function set_event_attendance(uuid, uuid[]) to authenticated;

-- Committee roster replacement follows the same pattern: authorization and
-- the current roster are resolved in the database, atomically.
create or replace function set_committee_roster(
  target_committee_id text,
  member_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  roster_member_id uuid;
begin
  if not can_manage_committee(target_committee_id) then
    raise exception 'not permitted';
  end if;

  if not exists (select 1 from committees where id = target_committee_id) then
    raise exception 'committee not found';
  end if;

  delete from committee_members where committee_id = target_committee_id;

  foreach roster_member_id in array coalesce(member_ids, '{}'::uuid[])
  loop
    insert into committee_members (committee_id, member_id)
    select target_committee_id, m.id
    from members m
    where m.id = roster_member_id and m.status in ('active', 'honorary')
    on conflict do nothing;
  end loop;
end;
$$;

revoke all on function set_committee_roster(text, uuid[]) from public;
revoke execute on function set_committee_roster(text, uuid[]) from anon;
grant execute on function set_committee_roster(text, uuid[]) to authenticated;
