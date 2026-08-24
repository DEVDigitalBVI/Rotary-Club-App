-- Keep message identity immutable even for callers that bypass the app, and
-- route replies / explicit @Full Name mentions into the existing inbox.

create or replace function enforce_chat_message_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.id <> old.id or new.channel_id <> old.channel_id
    or new.sender_id <> old.sender_id or new.created_at <> old.created_at
    or new.reply_to_id is distinct from old.reply_to_id then
    raise exception 'Message identity fields cannot be changed';
  end if;
  if old.deleted_at is not null and new.deleted_at is null then
    raise exception 'A removed message cannot be restored';
  end if;
  if new.body is distinct from old.body and new.deleted_at is null then
    new.edited_at := now();
  end if;
  return new;
end;
$$;
create trigger chat_messages_enforce_update before update on chat_messages
  for each row execute function enforce_chat_message_update();

drop policy if exists "chat_channel_reads_update" on chat_channel_reads;
create policy "chat_channel_reads_update" on chat_channel_reads for update to authenticated
  using (member_id = current_member_id())
  with check (member_id = current_member_id() and can_access_chat_channel(channel_id));

-- Access check for trusted notification routing, evaluated for a specified
-- member instead of the current session member.
create or replace function can_member_access_chat_channel(target_member_id uuid, target_channel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from chat_channels c join members member on member.id = target_member_id
    where c.id = target_channel_id and c.archived_at is null and member.status = 'active' and (
      c.kind = 'club'
      or (c.kind = 'committee' and exists (select 1 from committee_members cm where cm.committee_id = c.context_id and cm.member_id = target_member_id))
      or (c.kind = 'event' and exists (select 1 from event_rsvps er where er.event_id::text = c.context_id and er.member_id = target_member_id and er.status in ('yes', 'maybe')))
      or (c.kind = 'project' and exists (select 1 from project_volunteers pv where pv.project_id::text = c.context_id and pv.member_id = target_member_id))
      or (c.kind = 'dm' and exists (select 1 from chat_channel_members cm where cm.channel_id = c.id and cm.member_id = target_member_id))
    )
  );
$$;

create or replace function notify_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (recipient_id, type, title, body, link)
  select recipient.id, 'chat', sender.name || ' mentioned you', left(new.body, 180),
    '/chat?channel=' || new.channel_id::text || '&message=' || new.id::text
  from members recipient
  join members sender on sender.id = new.sender_id
  where recipient.id <> new.sender_id
    and recipient.status = 'active'
    and can_member_access_chat_channel(recipient.id, new.channel_id)
    and lower(new.body) like '%@' || lower(recipient.name) || '%'
  on conflict do nothing;

  if new.reply_to_id is not null then
    insert into notifications (recipient_id, type, title, body, link)
    select parent.sender_id, 'chat', sender.name || ' replied to you', left(new.body, 180),
      '/chat?channel=' || new.channel_id::text || '&message=' || new.id::text
    from chat_messages parent
    join members sender on sender.id = new.sender_id
    where parent.id = new.reply_to_id and parent.sender_id <> new.sender_id
      and not exists (
        select 1 from notifications n
        where n.recipient_id = parent.sender_id and n.link = '/chat?channel=' || new.channel_id::text || '&message=' || new.id::text
      );
  end if;
  return new;
end;
$$;

create trigger chat_messages_notify after insert on chat_messages
  for each row execute function notify_chat_message();

notify pgrst, 'reload schema';
