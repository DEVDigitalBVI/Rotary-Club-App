-- The emergency account is an operational credential, not a club member.
-- Keep it usable for break-glass authorization while removing it from every
-- member-facing roster query. The account may select its own row because the
-- app needs that row after authentication; list queries separately remove it.
drop policy if exists "members_select" on members;
create policy "members_select" on members for select to authenticated
  using (
    is_active_club_member()
    and (
      not members.is_superuser
      or members.user_id = (select auth.uid())
    )
  );

-- Club officers must not be able to change or remove the emergency record
-- through a guessed UUID/email. The account itself retains self-update access;
-- privileged columns remain protected by members_privileged_columns.
drop policy if exists "members_update" on members;
create policy "members_update" on members for update to authenticated
  using (
    (id = current_member_id() or runs_the_club())
    and (not members.is_superuser or members.user_id = (select auth.uid()))
  )
  with check (
    (id = current_member_id() or runs_the_club())
    and (not members.is_superuser or members.user_id = (select auth.uid()))
  );

drop policy if exists "members_delete" on members;
create policy "members_delete" on members for delete to authenticated
  using (runs_the_club() and id <> current_member_id() and not members.is_superuser);

-- SECURITY DEFINER birthday helpers bypass table RLS, so apply the hidden-row
-- rule explicitly. The emergency account can still load its own account data.
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
    and public.is_active_club_member()
    and (not m.is_superuser or m.user_id = (select auth.uid()));
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
    and not m.is_superuser
    and public.is_active_club_member();
$$;

revoke all on function get_member_birthdays() from public, anon;
grant execute on function get_member_birthdays() to authenticated;

-- An emergency credential should never become a social identity. Hide any
-- historical chat rows tied to it and refuse new direct conversations with it.
drop policy if exists "chat_channel_members_select" on chat_channel_members;
create policy "chat_channel_members_select" on chat_channel_members for select to authenticated
  using (
    can_access_chat_channel(channel_id)
    and exists (
      select 1 from members m
      where m.id = chat_channel_members.member_id and not m.is_superuser
    )
  );

drop policy if exists "chat_messages_select" on chat_messages;
create policy "chat_messages_select" on chat_messages for select to authenticated
  using (
    can_access_chat_channel(channel_id)
    and exists (
      select 1 from members m
      where m.id = chat_messages.sender_id and not m.is_superuser
    )
  );

drop policy if exists "chat_reactions_select" on chat_reactions;
create policy "chat_reactions_select" on chat_reactions for select to authenticated
  using (
    exists (
      select 1
      from chat_messages message
      join members reactor on reactor.id = chat_reactions.member_id
      where message.id = chat_reactions.message_id
        and not reactor.is_superuser
        and can_access_chat_channel(message.channel_id)
    )
  );

create or replace function get_or_create_direct_chat(other_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := current_member_id();
  found_channel uuid;
begin
  if me is null
    or me = other_member_id
    or not is_active_club_member()
    or is_superuser()
    or not exists (
      select 1 from members
      where id = other_member_id and status = 'active' and not is_superuser
    )
  then
    raise exception 'Invalid direct-message recipient';
  end if;

  select c.id into found_channel
  from chat_channels c
  join chat_channel_members mine on mine.channel_id = c.id and mine.member_id = me
  join chat_channel_members theirs on theirs.channel_id = c.id and theirs.member_id = other_member_id
  where c.kind = 'dm'
    and c.archived_at is null
    and (select count(*) from chat_channel_members all_members where all_members.channel_id = c.id) = 2
  limit 1;

  if found_channel is null then
    insert into chat_channels (name, kind, created_by)
      values ('Direct message', 'dm', me)
      returning id into found_channel;
    insert into chat_channel_members (channel_id, member_id)
      values (found_channel, me), (found_channel, other_member_id);
  end if;
  return found_channel;
end;
$$;

revoke all on function get_or_create_direct_chat(uuid) from public, anon;
grant execute on function get_or_create_direct_chat(uuid) to authenticated;

notify pgrst, 'reload schema';
