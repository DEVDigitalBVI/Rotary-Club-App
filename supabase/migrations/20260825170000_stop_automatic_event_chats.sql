-- Events are calendar records, not conversations. Creating an event should
-- never create a chat room as a side effect. Preserve any existing messages
-- for audit/history, but remove event rooms from the active chat list.
drop trigger if exists events_create_chat on events;
drop function if exists create_event_chat_channel();

update chat_channels
set archived_at = coalesce(archived_at, now())
where kind = 'event';
