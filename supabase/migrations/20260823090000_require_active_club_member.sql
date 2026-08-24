-- Supabase authentication proves control of an account, not membership in
-- this club. A user who signs up outside the app must not gain roster access.
create or replace function is_active_club_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from members
    where user_id = (select auth.uid())
      and status in ('active', 'honorary')
  );
$$;

revoke all on function is_active_club_member() from public;
revoke execute on function is_active_club_member() from anon;
grant execute on function is_active_club_member() to authenticated;

drop policy if exists "members_select" on members;
create policy "members_select" on members for select to authenticated
  using (is_active_club_member());

drop policy if exists "committees_select" on committees;
create policy "committees_select" on committees for select to authenticated
  using (is_active_club_member());

drop policy if exists "committee_members_select" on committee_members;
create policy "committee_members_select" on committee_members for select to authenticated
  using (is_active_club_member());

drop policy if exists "events_select" on events;
create policy "events_select" on events for select to authenticated
  using (is_active_club_member());

drop policy if exists "event_rsvps_select" on event_rsvps;
create policy "event_rsvps_select" on event_rsvps for select to authenticated
  using (is_active_club_member());

drop policy if exists "news_posts_select" on news_posts;
create policy "news_posts_select" on news_posts for select to authenticated
  using (is_active_club_member());

drop policy if exists "event_attendance_select" on event_attendance;
create policy "event_attendance_select" on event_attendance for select to authenticated
  using (is_active_club_member());
