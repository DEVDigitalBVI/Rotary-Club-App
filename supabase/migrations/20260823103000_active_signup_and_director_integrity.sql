-- Closed signup is for current members only. Keeping inactive roster records
-- is useful for club history, but those addresses must not create new logins.
create or replace function email_is_signup_eligible(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from members
    where lower(email) = lower(trim(target_email))
      and user_id is null
      and status in ('active', 'honorary')
  );
$$;

revoke all on function email_is_signup_eligible(text) from public;
grant execute on function email_is_signup_eligible(text) to anon, authenticated;

-- An officer must clear elected and committee-director responsibilities before
-- deactivating a member. This prevents stale privileged assignments and keeps
-- the committee roster invariant enforceable.
create or replace function prevent_deactivating_assigned_member()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'inactive'
    and old.status is distinct from 'inactive'
    and (
      old.position is not null
      or exists (select 1 from committees where director_id = old.id)
    )
  then
    raise exception 'clear member roles and directorships before deactivation';
  end if;

  return new;
end;
$$;

drop trigger if exists members_prevent_assigned_deactivation on members;
create trigger members_prevent_assigned_deactivation
before update of status on members
for each row execute function prevent_deactivating_assigned_member();

-- Replace the roster atomically while requiring the assigned director to be
-- both included and currently eligible for committee service.
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
  assigned_director_id uuid;
begin
  if not can_manage_committee(target_committee_id) then
    raise exception 'not permitted';
  end if;

  select director_id into assigned_director_id
  from committees
  where id = target_committee_id;

  if not found then
    raise exception 'committee not found';
  end if;

  if assigned_director_id is not null then
    if not (assigned_director_id = any(coalesce(member_ids, '{}'::uuid[]))) then
      raise exception 'committee director must remain on roster';
    end if;

    if not exists (
      select 1
      from members
      where id = assigned_director_id and status in ('active', 'honorary')
    ) then
      raise exception 'committee director must be active or honorary';
    end if;
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
