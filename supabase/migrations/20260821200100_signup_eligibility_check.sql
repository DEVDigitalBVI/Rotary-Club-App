-- Lets the (unauthenticated) signup form check whether an email is on the
-- roster and unclaimed, without exposing the members table to anon. Returns
-- only a boolean — no member data leaks beyond "is this email eligible."
create or replace function email_is_signup_eligible(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from members where email = target_email and user_id is null
  );
$$;

revoke all on function email_is_signup_eligible(text) from public;
grant execute on function email_is_signup_eligible(text) to anon, authenticated;
