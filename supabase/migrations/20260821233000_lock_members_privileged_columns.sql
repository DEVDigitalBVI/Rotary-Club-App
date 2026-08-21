-- Security fix: RLS is row-scoped only (Postgres has no column-level RLS),
-- so members_update's `id = current_member_id()` clause let any signed-in
-- member write is_superuser/position/role/recognition fields on their own
-- row directly via PostgREST, completely bypassing the security-definer
-- RPCs (assign_member_position, update_member_recognition, etc.) that were
-- supposed to be the only path to those columns — e.g. `update members set
-- is_superuser = true where id = current_member_id()` previously succeeded
-- for anyone. This trigger re-checks the same permission functions those
-- RPCs already use, so it's a no-op for legitimate RPC-driven writes and
-- blocks everything else. auth.uid() is null only for direct database
-- access (Supabase dashboard SQL editor, service_role, migrations) — never
-- for a real PostgREST/browser request — so that remains the one path that
-- can grant/revoke is_superuser at all, matching its break-glass intent.
create or replace function enforce_members_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  old_position text := case when tg_op = 'INSERT' then null else old.position end;
  old_role text := case when tg_op = 'INSERT' then 'member' else old.role end;
  old_is_superuser boolean := case when tg_op = 'INSERT' then false else old.is_superuser end;
  old_paul_harris_count integer := case when tg_op = 'INSERT' then 0 else old.paul_harris_count end;
  old_polio_plus_society boolean := case when tg_op = 'INSERT' then false else old.polio_plus_society end;
  old_action_groups text[] := case when tg_op = 'INSERT' then '{}'::text[] else old.action_groups end;
  touches_elect boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.is_superuser is distinct from old_is_superuser then
    raise exception 'is_superuser can only be changed via direct database access';
  end if;

  if new.position is distinct from old_position then
    touches_elect := coalesce(new.position in ('president-elect', 'secretary-elect'), false)
      or coalesce(old_position in ('president-elect', 'secretary-elect'), false);
    if touches_elect then
      if not is_president() then
        raise exception 'not permitted to set position';
      end if;
    elsif not can_assign_roles() then
      raise exception 'not permitted to set position';
    end if;
  end if;

  if new.role is distinct from old_role and not can_assign_roles() then
    raise exception 'not permitted to set role';
  end if;

  if (
    new.paul_harris_count is distinct from old_paul_harris_count
    or new.polio_plus_society is distinct from old_polio_plus_society
    or new.action_groups is distinct from old_action_groups
  ) and not can_edit_recognition() then
    raise exception 'not permitted to edit recognition fields';
  end if;

  return new;
end;
$$;

drop trigger if exists members_privileged_columns on members;
create trigger members_privileged_columns
  before insert or update on members
  for each row
  execute function enforce_members_privileged_columns();

-- Self-insert was never used by the app: addMemberAction (the only insert
-- path) relies solely on runs_the_club() and lets an officer add a roster
-- row for someone else; a person joins their own row later through
-- claim_member() after signing up against a pre-existing email. Allowing
-- `user_id = auth.uid()` on insert let anyone who could create a Supabase
-- Auth account — signup is only gated client-side by
-- email_is_signup_eligible, not enforced by Postgres/Auth itself — insert
-- an arbitrary roster row for themselves regardless of the closed-roster
-- policy.
drop policy if exists "members_insert" on members;
create policy "members_insert" on members for insert to authenticated
  with check (runs_the_club());
