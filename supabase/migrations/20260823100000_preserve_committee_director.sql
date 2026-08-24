-- A committee's assigned director is always part of its roster. The UI keeps
-- the director selected, but RPC arguments are untrusted and must enforce the
-- same invariant in the database.
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

  if exists (
    select 1
    from committees
    where id = target_committee_id
      and director_id is not null
      and not (director_id = any(coalesce(member_ids, '{}'::uuid[])))
  ) then
    raise exception 'committee director must remain on roster';
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
