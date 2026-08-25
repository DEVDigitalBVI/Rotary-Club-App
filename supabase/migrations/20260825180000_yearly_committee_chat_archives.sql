-- Committee conversations roll over with the Rotary year. Active rooms follow
-- the live roster; archived rooms are read-only and use a membership snapshot.
alter table chat_channels add column rotary_year text;

create or replace function current_rotary_year()
returns text language sql stable set search_path = public as $$
  select case when extract(month from current_date) >= 7
    then extract(year from current_date)::int::text || '-' || right((extract(year from current_date)::int + 1)::text, 2)
    else (extract(year from current_date)::int - 1)::text || '-' || right(extract(year from current_date)::int::text, 2)
  end;
$$;

update chat_channels set rotary_year = current_rotary_year() where kind = 'committee';
alter table chat_channels add constraint committee_chat_has_rotary_year
  check (kind <> 'committee' or rotary_year is not null);

drop index chat_channels_one_context_idx;
create unique index chat_channels_one_context_year_idx
  on chat_channels (kind, context_id, coalesce(rotary_year, '')) where context_id is not null;

create or replace function can_access_chat_channel(target_channel_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from chat_channels c where c.id = target_channel_id and (
      (c.kind = 'club' and c.archived_at is null and is_active_club_member())
      or (c.kind = 'committee' and (
        (c.archived_at is null and exists (
          select 1 from committee_members cm where cm.committee_id = c.context_id and cm.member_id = current_member_id()
        ))
        or (c.archived_at is not null and (
          runs_the_club() or exists (
            select 1 from chat_channel_members snapshot
            where snapshot.channel_id = c.id and snapshot.member_id = current_member_id()
          )
        ))
      ))
      or (c.kind = 'project' and c.archived_at is null and (
        can_manage_committee('community-service') or exists (
          select 1 from project_volunteers pv where pv.project_id::text = c.context_id and pv.member_id = current_member_id()
        )
      ))
      or (c.kind = 'dm' and c.archived_at is null and exists (
        select 1 from chat_channel_members ccm where ccm.channel_id = c.id and ccm.member_id = current_member_id()
      ))
    )
  );
$$;

-- Archived rooms may be read, but cannot receive edits, messages, or reactions.
drop policy if exists "chat_messages_insert" on chat_messages;
create policy "chat_messages_insert" on chat_messages for insert to authenticated
  with check (sender_id = current_member_id() and can_access_chat_channel(channel_id)
    and exists (select 1 from chat_channels c where c.id = channel_id and c.archived_at is null)
    and (reply_to_id is null or exists (
      select 1 from chat_messages parent where parent.id = reply_to_id and parent.channel_id = channel_id
    )));

drop policy if exists "chat_messages_update" on chat_messages;
create policy "chat_messages_update" on chat_messages for update to authenticated
  using ((sender_id = current_member_id() or is_board_member())
    and exists (select 1 from chat_channels c where c.id = channel_id and c.archived_at is null))
  with check (can_access_chat_channel(channel_id));

drop policy if exists "chat_reactions_insert" on chat_reactions;
create policy "chat_reactions_insert" on chat_reactions for insert to authenticated
  with check (member_id = current_member_id() and exists (
    select 1 from chat_messages m join chat_channels c on c.id = m.channel_id
    where m.id = message_id and c.archived_at is null and can_access_chat_channel(m.channel_id)
  ));

drop policy if exists "chat_reactions_delete" on chat_reactions;
create policy "chat_reactions_delete" on chat_reactions for delete to authenticated
  using (member_id = current_member_id() and exists (
    select 1 from chat_messages m join chat_channels c on c.id = m.channel_id
    where m.id = message_id and c.archived_at is null
  ));

create or replace function rollover_committee_chats()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_assign_roles() then raise exception 'not permitted'; end if;
  if exists (
    select 1 from chat_channels
    where kind = 'committee' and archived_at is null and rotary_year = current_rotary_year()
  ) then
    raise exception 'committee chats already exist for the current Rotary year';
  end if;

  insert into chat_channel_members (channel_id, member_id)
    select c.id, cm.member_id from chat_channels c
    join committee_members cm on cm.committee_id = c.context_id
    where c.kind = 'committee' and c.archived_at is null
    on conflict do nothing;

  update chat_channels set archived_at = now()
    where kind = 'committee' and archived_at is null;

  insert into chat_channels (name, kind, context_id, rotary_year)
    select name, 'committee', id, current_rotary_year() from committees
    on conflict do nothing;
end;
$$;
revoke all on function rollover_committee_chats() from public;
revoke execute on function rollover_committee_chats() from anon;
grant execute on function rollover_committee_chats() to authenticated;

-- Keep officer promotion and chat rollover atomic: either the full annual
-- handover succeeds, or neither roles nor conversations change.
create or replace function start_new_rotary_year()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_assign_roles() then raise exception 'not permitted'; end if;
  perform rollover_committee_chats();
  update members set position = null where position in ('president', 'secretary');
  update members set position = 'president' where position = 'president-elect';
  update members set position = 'secretary' where position = 'secretary-elect';
end;
$$;

-- Return only the newest page for each accessible room. Older pages are loaded
-- on demand, keeping initial chat payloads bounded as history grows.
create or replace function get_recent_chat_messages(per_channel_limit integer default 50)
returns table (id uuid, channel_id uuid, sender_id uuid, body text, reply_to_id uuid,
  edited_at timestamptz, deleted_at timestamptz, created_at timestamptz, total_count bigint)
language sql stable security invoker set search_path = public as $$
  with ranked as (
    select m.*, row_number() over (partition by m.channel_id order by m.created_at desc) as page_row,
      count(*) over (partition by m.channel_id) as total_count
    from chat_messages m
    where can_access_chat_channel(m.channel_id)
  )
  select id, channel_id, sender_id, body, reply_to_id, edited_at, deleted_at, created_at, total_count
  from ranked where page_row <= greatest(1, least(per_channel_limit, 100))
  order by channel_id, created_at;
$$;
grant execute on function get_recent_chat_messages(integer) to authenticated;

create table chat_retention_policies (
  channel_kind text primary key check (channel_kind in ('club', 'committee', 'project', 'dm')),
  retention_months integer not null check (retention_months > 0),
  updated_at timestamptz not null default now()
);
insert into chat_retention_policies values
  ('club', 36, now()), ('committee', 84, now()), ('project', 60, now()), ('dm', 24, now());
alter table chat_retention_policies enable row level security;
create policy "chat_retention_policies_select" on chat_retention_policies for select to authenticated using (runs_the_club());
