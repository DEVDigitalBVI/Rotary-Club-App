-- Emergency superuser flag: a small number of dedicated, rarely-used
-- accounts (not real club members) that carry full standing everywhere,
-- independent of the elected `position` roster. Kept as its own column
-- rather than a `position` value because `position` is unique per value
-- (members_position_unique) and gets wiped every annual handover
-- (start_new_rotary_year) — a superuser account must survive both without
-- displacing whoever actually holds an elected seat.
alter table members add column is_superuser boolean not null default false;

-- Single source of truth for the superuser check, so it isn't repeated
-- inline in every permission function below.
create or replace function is_superuser()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from members where id = current_member_id() and is_superuser
  );
$$;

-- canPostNews(): any board member (officers + every committee director),
-- or a superuser.
create or replace function is_board_member()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    is_superuser()
    or exists (
      select 1 from committee_members
      where committee_id = 'board' and member_id = current_member_id()
    );
$$;

-- runsTheClub(): President/President-Elect/Secretary/Secretary-Elect, the
-- Club Administration director, or a superuser.
create or replace function runs_the_club()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    is_superuser()
    or exists (
      select 1 from members
      where id = current_member_id()
        and position in ('president', 'president-elect', 'secretary', 'secretary-elect')
    )
    or exists (
      select 1 from committees
      where id = 'club-administration' and director_id = current_member_id()
    );
$$;

-- canEditRecognition(): Secretary/Secretary-Elect, the Foundation director,
-- or a superuser.
create or replace function can_edit_recognition()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    is_superuser()
    or exists (
      select 1 from members
      where id = current_member_id() and position in ('secretary', 'secretary-elect')
    )
    or exists (
      select 1 from committees
      where id = 'foundation' and director_id = current_member_id()
    );
$$;

-- committeeManageRight(): that committee's own director, the
-- President/Secretary overriding on their behalf, or a superuser.
create or replace function can_manage_committee(target_committee_id text)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    is_superuser()
    or exists (
      select 1 from committees
      where id = target_committee_id and director_id = current_member_id()
    )
    or exists (
      select 1 from members
      where id = current_member_id() and position in ('president', 'secretary')
    );
$$;

-- can_assign_roles(): who may assign President, Secretary, Treasurer,
-- committee directors, and run the annual handover — now also a superuser.
create or replace function can_assign_roles()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    is_superuser()
    or exists (
      select 1 from members
      where id = current_member_id()
        and position in ('president', 'president-elect', 'secretary', 'secretary-elect')
    );
$$;

-- is_president(): the one person who may name a President-Elect or
-- Secretary-Elect — now also a superuser, for the emergency case where no
-- president is seated at all.
create or replace function is_president()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    is_superuser()
    or exists (
      select 1 from members where id = current_member_id() and position = 'president'
    );
$$;
