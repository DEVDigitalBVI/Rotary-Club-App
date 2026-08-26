-- A direct-message creator may remove the conversation they started. Keep
-- this behind a security-definer function so clients never receive a broad
-- delete policy on chat channels.
create or replace function delete_owned_direct_chat(target_channel_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_id uuid;
begin
  delete from chat_channels
  where id = target_channel_id
    and kind = 'dm'
    and created_by = current_member_id()
  returning id into deleted_id;

  if deleted_id is null then
    raise exception 'Only the member who started this direct chat can delete it';
  end if;
end;
$$;

grant execute on function delete_owned_direct_chat(uuid) to authenticated;

-- Keep the database constraint aligned with the expanded reaction palette.
alter table chat_reactions drop constraint if exists chat_reactions_emoji_check;
alter table chat_reactions add constraint chat_reactions_emoji_check
  check (emoji in ('👍', '❤️', '👏', '🎉', '🙏', '😊', '😂', '🙌', '🔥', '💯', '✅', '👀', '🤝', '💡', '📌'));
