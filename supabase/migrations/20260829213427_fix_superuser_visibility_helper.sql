-- is_superuser() must read a column that is intentionally not granted to the
-- authenticated role. Run this one narrow lookup as the function owner while
-- binding it strictly to auth.uid(); callers cannot inspect another account.
create or replace function public.is_superuser()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.members member
      where member.user_id = (select auth.uid())
        and member.is_superuser
    );
$$;

revoke all on function public.is_superuser() from public, anon;
grant execute on function public.is_superuser() to authenticated, service_role;

notify pgrst, 'reload schema';
