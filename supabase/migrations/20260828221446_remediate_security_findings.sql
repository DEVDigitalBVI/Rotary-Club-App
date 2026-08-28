-- Remediate the validated application-security findings without rewriting
-- migration history. Browser clients can reach these objects through the
-- Data API, so each authorization decision lives in PostgreSQL rather than
-- relying on page redirects or hidden UI controls.

-- ---------------------------------------------------------------------------
-- Former members must lose every chat capability, including access inherited
-- from stale committee/project/DM memberships and archived snapshots.
-- ---------------------------------------------------------------------------

create or replace function can_access_chat_channel(target_channel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_active_club_member() and exists (
    select 1 from chat_channels c where c.id = target_channel_id and (
      (c.kind = 'club' and c.archived_at is null)
      or (c.kind = 'committee' and (
        (c.archived_at is null and exists (
          select 1 from committee_members cm
          where cm.committee_id = c.context_id and cm.member_id = current_member_id()
        ))
        or (c.archived_at is not null and (
          runs_the_club() or exists (
            select 1 from chat_channel_members snapshot
            where snapshot.channel_id = c.id and snapshot.member_id = current_member_id()
          )
        ))
      ))
      or (c.kind = 'project' and c.archived_at is null and (
        can_manage_committee('community-service') or exists (
          select 1 from project_volunteers pv
          where pv.project_id::text = c.context_id and pv.member_id = current_member_id()
        )
      ))
      or (c.kind = 'dm' and c.archived_at is null and exists (
        select 1 from chat_channel_members ccm
        where ccm.channel_id = c.id and ccm.member_id = current_member_id()
      ))
    )
  );
$$;

revoke all on function can_access_chat_channel(uuid) from public, anon;
grant execute on function can_access_chat_channel(uuid) to authenticated;

create or replace function delete_owned_direct_chat(target_channel_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_id uuid;
begin
  if not is_active_club_member() then
    raise exception 'Only active club members can delete direct chats';
  end if;

  delete from chat_channels
  where id = target_channel_id
    and kind = 'dm'
    and archived_at is null
    and created_by = current_member_id()
    and can_access_chat_channel(id)
  returning id into deleted_id;

  if deleted_id is null then
    raise exception 'Only the active member who started this direct chat can delete it';
  end if;
end;
$$;

revoke all on function delete_owned_direct_chat(uuid) from public, anon;
grant execute on function delete_owned_direct_chat(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The member directory exposes only its intentional contact/club fields.
-- Full birth dates remain available only to the member or club leadership;
-- ordinary directory readers receive month/day through a narrow RPC.
-- ---------------------------------------------------------------------------

create or replace function current_member_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.members m
  where m.user_id = (select auth.uid());
$$;

revoke all on function current_member_id() from public, anon;
grant execute on function current_member_id() to authenticated;

revoke select on table members from authenticated;
grant select (
  id, name, email, phone, classification, join_date, status, position,
  bio, avatar_color, avatar_url, paul_harris_count, polio_plus_society,
  action_groups
) on table members to authenticated;

create or replace function get_member_birthday(target_member_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when m.date_of_birth is null then null
    when m.id = public.current_member_id() or public.runs_the_club()
      then m.date_of_birth::text
    else '2000-' || to_char(m.date_of_birth, 'MM-DD')
  end
  from public.members m
  where m.id = target_member_id
    and public.is_active_club_member();
$$;

revoke all on function get_member_birthday(uuid) from public, anon;
grant execute on function get_member_birthday(uuid) to authenticated;

create or replace function get_member_birthdays()
returns table (member_id uuid, birthday text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id,
    case
      when m.id = public.current_member_id() or public.runs_the_club()
        then m.date_of_birth::text
      else '2000-' || to_char(m.date_of_birth, 'MM-DD')
    end
  from public.members m
  where m.date_of_birth is not null
    and public.is_active_club_member();
$$;

revoke all on function get_member_birthdays() from public, anon;
grant execute on function get_member_birthdays() to authenticated;

-- A member may edit only profile fields the product labels self-service.
-- Leadership keeps its existing roster-management path, and the exact
-- unclaimed -> auth.uid() transition remains available to claim_member().
create or replace function enforce_members_self_service_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or runs_the_club() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.name is distinct from old.name
    or new.email is distinct from old.email
    or new.classification is distinct from old.classification
    or new.join_date is distinct from old.join_date
    or new.status is distinct from old.status
    or new.created_at is distinct from old.created_at
  then
    raise exception 'only club leadership can edit roster identity fields';
  end if;

  if new.user_id is distinct from old.user_id
    and not (old.user_id is null and new.user_id = auth.uid())
  then
    raise exception 'member account links cannot be reassigned';
  end if;

  return new;
end;
$$;

drop trigger if exists members_self_service_columns on members;
create trigger members_self_service_columns
  before update on members
  for each row
  execute function enforce_members_self_service_columns();

-- ---------------------------------------------------------------------------
-- Detailed engagement records are self/manager-only. Ordinary members retain
-- a non-sensitive approved-hours aggregate for project progress displays.
-- ---------------------------------------------------------------------------

drop policy if exists "event_attendance_select" on event_attendance;
create policy "event_attendance_select" on event_attendance for select to authenticated
  using (member_id = current_member_id() or can_assign_roles());

drop policy if exists "volunteer_hours_select" on volunteer_hours;
create policy "volunteer_hours_select" on volunteer_hours for select to authenticated
  using (member_id = current_member_id() or can_manage_committee('community-service'));

create or replace function get_project_approved_hours()
returns table (project_id uuid, hours numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select vh.project_id, coalesce(sum(vh.hours), 0)::numeric
  from public.volunteer_hours vh
  where vh.approved_at is not null
    and public.is_active_club_member()
  group by vh.project_id;
$$;

revoke all on function get_project_approved_hours() from public, anon;
grant execute on function get_project_approved_hours() to authenticated;

-- The old public boolean was a roster/account-state oracle. Creating an Auth
-- account is not membership: unlinked accounts still fail every club-data RLS
-- policy, while claim_member() remains the only route to an active roster row.
revoke all on function email_is_signup_eligible(text) from public, anon, authenticated;

notify pgrst, 'reload schema';
