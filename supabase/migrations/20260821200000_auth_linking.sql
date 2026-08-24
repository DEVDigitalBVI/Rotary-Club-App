-- Links a member's roster row (added by an officer) to their auth account
-- once they sign in for the first time.
--
-- A roster entry predates having an account, so the two are linked by
-- matching verified email — the one case where updating an unlinked row is
-- legitimate. That's a narrow security-definer RPC rather than a general RLS
-- carve-out: it can only ever set user_id to the caller's own auth.uid(),
-- only on the row matching their own verified JWT email, and only while
-- that row is still unclaimed.
create or replace function claim_member()
returns members
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed members;
begin
  update members
  set user_id = auth.uid()
  where email = (auth.jwt() ->> 'email') and user_id is null
  returning * into claimed;

  return claimed;
end;
$$;

-- Supabase's default privileges grant EXECUTE on every new public function
-- to anon/authenticated/service_role; only a signed-in user should be able
-- to claim a roster row.
revoke all on function claim_member() from public;
revoke execute on function claim_member() from anon;
grant execute on function claim_member() to authenticated;

-- A roster entry can predate the club recording exactly when someone joined.
alter table members alter column join_date drop not null;
