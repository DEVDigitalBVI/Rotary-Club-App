-- Chat RLS must determine whether a referenced member is visible, but the
-- authenticated role intentionally cannot read members.is_superuser. Keep the
-- lookup in a schema that is not exposed by the Data API, bind it to an active
-- authenticated caller, and return only a visibility decision.
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated, service_role;

create or replace function app_private.is_visible_member(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and public.is_active_club_member()
    and exists (
      select 1
      from public.members member
      where member.id = target_member_id
        and not member.is_superuser
    );
$$;

revoke all on function app_private.is_visible_member(uuid) from public, anon;
grant execute on function app_private.is_visible_member(uuid) to authenticated, service_role;

drop policy if exists "chat_channel_members_select" on public.chat_channel_members;
create policy "chat_channel_members_select"
on public.chat_channel_members for select to authenticated
using (
  public.can_access_chat_channel(channel_id)
  and app_private.is_visible_member(member_id)
);

drop policy if exists "chat_messages_select" on public.chat_messages;
create policy "chat_messages_select"
on public.chat_messages for select to authenticated
using (
  public.can_access_chat_channel(channel_id)
  and app_private.is_visible_member(sender_id)
);

drop policy if exists "chat_reactions_select" on public.chat_reactions;
create policy "chat_reactions_select"
on public.chat_reactions for select to authenticated
using (
  app_private.is_visible_member(member_id)
  and exists (
    select 1
    from public.chat_messages message
    where message.id = chat_reactions.message_id
      and public.can_access_chat_channel(message.channel_id)
  )
);

notify pgrst, 'reload schema';
