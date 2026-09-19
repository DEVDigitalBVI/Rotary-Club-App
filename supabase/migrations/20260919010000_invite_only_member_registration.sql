-- Portal accounts are created only by invitation. The President, Secretary,
-- and Membership Committee director may add the matching roster record.
create or replace function can_invite_members()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from members m
    where m.user_id = (select auth.uid())
      and m.status in ('active', 'honorary')
      and (
        m.position in ('president', 'secretary')
        or exists (
          select 1
          from committees c
          where c.id = 'membership' and c.director_id = m.id
        )
      )
  );
$$;

revoke all on function can_invite_members() from public, anon;
grant execute on function can_invite_members() to authenticated;

-- The former public eligibility probe is no longer part of any supported
-- registration flow.
revoke all on function email_is_signup_eligible(text) from public, anon, authenticated;

drop policy if exists "members_insert" on members;
create policy "members_insert" on members for insert to authenticated
  with check (can_invite_members());

-- Email casing must not prevent a verified invited account from claiming the
-- roster row that caused its invitation.
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
  where lower(email) = lower(auth.jwt() ->> 'email') and user_id is null
  returning * into claimed;

  return claimed;
end;
$$;

revoke all on function claim_member() from public, anon;
grant execute on function claim_member() to authenticated;
