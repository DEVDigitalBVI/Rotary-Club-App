-- Officer/director role assignment: President-Elect and Secretary-Elect
-- join the roster of assignable positions, each carrying the same standing
-- as the seat they're elected to (runs_the_club, can_edit_recognition), and
-- three RPCs give the President/Secretary a real way to assign roles that
-- the UI has never had — position, committee director, and the annual
-- handover — rather than relying on someone editing rows by hand.

alter table members drop constraint members_position_check;
alter table members add constraint members_position_check
  check (position in ('president', 'president-elect', 'secretary', 'secretary-elect', 'treasurer'));

-- runsTheClub(): now includes the Elects, who have full access once the
-- President assigns them — see assign_member_position()'s permission split
-- below for the narrower rule on *setting* an Elect position itself.
create or replace function runs_the_club()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    exists (
      select 1 from members
      where id = current_member_id()
        and position in ('president', 'president-elect', 'secretary', 'secretary-elect')
    )
    or exists (
      select 1 from committees
      where id = 'club-administration' and director_id = current_member_id()
    );
$$;

-- canEditRecognition(): Secretary-Elect carries the same standing as
-- Secretary here too, for the same full-access reason.
create or replace function can_edit_recognition()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    exists (
      select 1 from members
      where id = current_member_id() and position in ('secretary', 'secretary-elect')
    )
    or exists (
      select 1 from committees
      where id = 'foundation' and director_id = current_member_id()
    );
$$;

-- can_assign_roles(): who may assign President, Secretary, Treasurer, and
-- committee directors, and who may run the annual handover. Deliberately
-- narrower than runs_the_club() — the Club Administration director runs
-- meetings, not the roster.
create or replace function can_assign_roles()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from members
    where id = current_member_id()
      and position in ('president', 'president-elect', 'secretary', 'secretary-elect')
  );
$$;

-- is_president(): the one person who may name a President-Elect or
-- Secretary-Elect. Deliberately excludes the Elects themselves — full
-- access to run the club day to day is not the same as the standing to
-- name your own successor.
create or replace function is_president()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from members
    where id = current_member_id() and position = 'president'
  );
$$;

-- Sets or clears a member's elected position. Routed through an RPC rather
-- than a plain table update because the permission rule is split: naming a
-- President-Elect or Secretary-Elect is the President's alone, while the
-- seats those Elects have full access to (President, Secretary, Treasurer)
-- follow the wider can_assign_roles() group. The unique index on position
-- means at most one member holds a given position, so taking a position
-- bumps whoever currently holds it back to none first.
create or replace function assign_member_position(
  target_member_id uuid,
  new_position text
)
returns members
language plpgsql
security definer
set search_path = public
as $$
declare
  updated members;
  current_position text;
  touches_elect boolean;
begin
  if new_position is not null
    and new_position not in ('president', 'president-elect', 'secretary', 'secretary-elect', 'treasurer')
  then
    raise exception 'invalid position';
  end if;

  select position into current_position from members where id = target_member_id;

  touches_elect := coalesce(new_position in ('president-elect', 'secretary-elect'), false)
    or coalesce(current_position in ('president-elect', 'secretary-elect'), false);

  if touches_elect then
    if not is_president() then
      raise exception 'not permitted';
    end if;
  elsif not can_assign_roles() then
    raise exception 'not permitted';
  end if;

  if new_position is not null then
    update members set position = null
    where position = new_position and id <> target_member_id;
  end if;

  update members set position = new_position
  where id = target_member_id
  returning * into updated;

  return updated;
end;
$$;

revoke all on function assign_member_position(uuid, text) from public;
revoke execute on function assign_member_position(uuid, text) from anon;
grant execute on function assign_member_position(uuid, text) to authenticated;

-- Sets or clears a committee's director. Also seats the new director on
-- their own committee's roster, matching ManageCommitteeDialog's existing
-- assumption that a director always appears in their committee's member
-- list.
create or replace function assign_committee_director(
  target_committee_id text,
  target_member_id uuid
)
returns committees
language plpgsql
security definer
set search_path = public
as $$
declare
  updated committees;
begin
  if not can_assign_roles() then
    raise exception 'not permitted';
  end if;

  update committees set director_id = target_member_id
  where id = target_committee_id
  returning * into updated;

  if updated is null then
    raise exception 'committee not found';
  end if;

  if target_member_id is not null then
    insert into committee_members (committee_id, member_id)
    values (target_committee_id, target_member_id)
    on conflict do nothing;
  end if;

  return updated;
end;
$$;

revoke all on function assign_committee_director(text, uuid) from public;
revoke execute on function assign_committee_director(text, uuid) from anon;
grant execute on function assign_committee_director(text, uuid) to authenticated;

-- The manual "Start new Rotary year" action: promotes President-Elect and
-- Secretary-Elect into the seats they were elected to, and clears whoever
-- was outgoing. Clears the outgoing officers before installing the
-- incoming ones, since the unique index on position allows only one member
-- per position at a time. A vacant Elect slot just leaves that seat vacant
-- rather than erroring — the club can assign it by hand afterward.
create or replace function start_new_rotary_year()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_assign_roles() then
    raise exception 'not permitted';
  end if;

  update members set position = null where position in ('president', 'secretary');
  update members set position = 'president' where position = 'president-elect';
  update members set position = 'secretary' where position = 'secretary-elect';
end;
$$;

revoke all on function start_new_rotary_year() from public;
revoke execute on function start_new_rotary_year() from anon;
grant execute on function start_new_rotary_year() to authenticated;
