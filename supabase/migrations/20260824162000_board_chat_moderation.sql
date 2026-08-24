-- Board members may moderate messages, but only in conversations they can access.
drop policy if exists "chat_messages_update" on chat_messages;

create policy "chat_messages_update" on chat_messages for update to authenticated
  using (
    can_access_chat_channel(channel_id)
    and (sender_id = current_member_id() or is_board_member())
  )
  with check (can_access_chat_channel(channel_id));
