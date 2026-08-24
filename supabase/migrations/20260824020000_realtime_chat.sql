-- Persistent club chat with context-aware access, unread state, replies,
-- reactions, direct messages, full-text search, and Realtime publication.

create table chat_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('club', 'committee', 'event', 'project', 'dm')),
  context_id text,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint chat_channels_context check (
    (kind in ('club', 'dm') and context_id is null)
    or (kind in ('committee', 'event', 'project') and context_id is not null)
  )
);

create unique index chat_channels_one_context_idx
  on chat_channels (kind, context_id) where context_id is not null;
create unique index chat_channels_one_club_idx
  on chat_channels (kind) where kind = 'club';

create table chat_channel_members (
  channel_id uuid not null references chat_channels (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, member_id)
);
create index chat_channel_members_member_idx on chat_channel_members (member_id);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references chat_channels (id) on delete cascade,
  sender_id uuid not null references members (id) on delete restrict,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  reply_to_id uuid references chat_messages (id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  search_vector tsvector generated always as (to_tsvector('english', body)) stored
);
create index chat_messages_channel_created_idx on chat_messages (channel_id, created_at desc);
create index chat_messages_search_idx on chat_messages using gin (search_vector);

create table chat_reactions (
  message_id uuid not null references chat_messages (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '👏', '🎉', '🙏')),
  created_at timestamptz not null default now(),
  primary key (message_id, member_id, emoji)
);

create table chat_channel_reads (
  channel_id uuid not null references chat_channels (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (channel_id, member_id)
);

create or replace function can_access_chat_channel(target_channel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from chat_channels c
    where c.id = target_channel_id and c.archived_at is null and (
      (c.kind = 'club' and is_active_club_member())
      or (c.kind = 'committee' and exists (
        select 1 from committee_members cm
        where cm.committee_id = c.context_id and cm.member_id = current_member_id()
      ))
      or (c.kind = 'event' and (
        runs_the_club() or exists (
          select 1 from event_rsvps er
          where er.event_id::text = c.context_id and er.member_id = current_member_id()
            and er.status in ('yes', 'maybe')
        )
      ))
      or (c.kind = 'project' and (
        can_manage_committee('community-service') or exists (
          select 1 from project_volunteers pv
          where pv.project_id::text = c.context_id and pv.member_id = current_member_id()
        )
      ))
      or (c.kind = 'dm' and exists (
        select 1 from chat_channel_members ccm
        where ccm.channel_id = c.id and ccm.member_id = current_member_id()
      ))
    )
  );
$$;

alter table chat_channels enable row level security;
alter table chat_channel_members enable row level security;
alter table chat_messages enable row level security;
alter table chat_reactions enable row level security;
alter table chat_channel_reads enable row level security;

create policy "chat_channels_select" on chat_channels for select to authenticated
  using (can_access_chat_channel(id));
create policy "chat_channel_members_select" on chat_channel_members for select to authenticated
  using (can_access_chat_channel(channel_id));
create policy "chat_messages_select" on chat_messages for select to authenticated
  using (can_access_chat_channel(channel_id));
create policy "chat_messages_insert" on chat_messages for insert to authenticated
  with check (sender_id = current_member_id() and can_access_chat_channel(channel_id)
    and (reply_to_id is null or exists (
      select 1 from chat_messages parent where parent.id = reply_to_id and parent.channel_id = channel_id
    )));
create policy "chat_messages_update" on chat_messages for update to authenticated
  using (sender_id = current_member_id() or runs_the_club())
  with check (can_access_chat_channel(channel_id));
create policy "chat_reactions_select" on chat_reactions for select to authenticated
  using (exists (select 1 from chat_messages m where m.id = message_id and can_access_chat_channel(m.channel_id)));
create policy "chat_reactions_insert" on chat_reactions for insert to authenticated
  with check (member_id = current_member_id() and exists (
    select 1 from chat_messages m where m.id = message_id and can_access_chat_channel(m.channel_id)
  ));
create policy "chat_reactions_delete" on chat_reactions for delete to authenticated
  using (member_id = current_member_id());
create policy "chat_channel_reads_select" on chat_channel_reads for select to authenticated
  using (member_id = current_member_id());
create policy "chat_channel_reads_insert" on chat_channel_reads for insert to authenticated
  with check (member_id = current_member_id() and can_access_chat_channel(channel_id));
create policy "chat_channel_reads_update" on chat_channel_reads for update to authenticated
  using (member_id = current_member_id()) with check (member_id = current_member_id());

-- Direct messages must be created atomically so no half-created room can be
-- observed and callers cannot add themselves to arbitrary private rooms.
create or replace function get_or_create_direct_chat(other_member_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := current_member_id();
  found_channel uuid;
begin
  if me is null or me = other_member_id or not is_active_club_member()
    or not exists (select 1 from members where id = other_member_id and status = 'active') then
    raise exception 'Invalid direct-message recipient';
  end if;

  select c.id into found_channel
  from chat_channels c
  join chat_channel_members mine on mine.channel_id = c.id and mine.member_id = me
  join chat_channel_members theirs on theirs.channel_id = c.id and theirs.member_id = other_member_id
  where c.kind = 'dm'
    and (select count(*) from chat_channel_members all_members where all_members.channel_id = c.id) = 2
  limit 1;

  if found_channel is null then
    insert into chat_channels (name, kind, created_by) values ('Direct message', 'dm', me)
      returning id into found_channel;
    insert into chat_channel_members (channel_id, member_id)
      values (found_channel, me), (found_channel, other_member_id);
  end if;
  return found_channel;
end;
$$;
grant execute on function get_or_create_direct_chat(uuid) to authenticated;

create or replace function search_chat_messages(search_query text)
returns table (id uuid, channel_id uuid, sender_id uuid, body text, reply_to_id uuid,
  edited_at timestamptz, deleted_at timestamptz, created_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select m.id, m.channel_id, m.sender_id, m.body, m.reply_to_id,
    m.edited_at, m.deleted_at, m.created_at
  from chat_messages m
  where m.search_vector @@ websearch_to_tsquery('english', search_query)
    and can_access_chat_channel(m.channel_id)
  order by ts_rank(m.search_vector, websearch_to_tsquery('english', search_query)) desc,
    m.created_at desc
  limit 50;
$$;
grant execute on function search_chat_messages(text) to authenticated;

-- Create rooms for current and future club contexts.
insert into chat_channels (name, kind) values ('Clubhouse', 'club');
insert into chat_channels (name, kind, context_id)
  select name, 'committee', id from committees on conflict do nothing;
insert into chat_channels (name, kind, context_id)
  select title, 'event', id::text from events on conflict do nothing;
insert into chat_channels (name, kind, context_id)
  select title, 'project', id::text from service_projects on conflict do nothing;

create or replace function create_context_chat_channel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into chat_channels (name, kind, context_id)
  values (new.name, 'committee', new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger committees_create_chat after insert on committees
  for each row execute function create_context_chat_channel();

create or replace function create_event_chat_channel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into chat_channels (name, kind, context_id)
  values (new.title, 'event', new.id::text) on conflict do nothing;
  return new;
end;
$$;
create trigger events_create_chat after insert on events
  for each row execute function create_event_chat_channel();

create or replace function create_project_chat_channel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into chat_channels (name, kind, context_id)
  values (new.title, 'project', new.id::text) on conflict do nothing;
  return new;
end;
$$;
create trigger projects_create_chat after insert on service_projects
  for each row execute function create_project_chat_channel();

-- Realtime respects the SELECT policies above and only delivers readable rows.
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table chat_reactions;
