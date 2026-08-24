-- Make important club notices visible, time-bounded, and accountable.

alter table news_posts
  add column priority text not null default 'normal'
    check (priority in ('normal', 'important', 'urgent')),
  add column is_pinned boolean not null default false,
  add column expires_at date,
  add column requires_acknowledgement boolean not null default false;

create index news_posts_active_priority_idx
  on news_posts (is_pinned desc, priority, published_at desc);

create table news_acknowledgements (
  post_id uuid not null references news_posts (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  primary key (post_id, member_id)
);

create index news_acknowledgements_member_idx
  on news_acknowledgements (member_id, acknowledged_at desc);

alter table news_acknowledgements enable row level security;

create policy "news_acknowledgements_select"
  on news_acknowledgements for select to authenticated
  using (member_id = current_member_id() or runs_the_club());

create policy "news_acknowledgements_insert"
  on news_acknowledgements for insert to authenticated
  with check (
    member_id = current_member_id()
    and exists (
      select 1 from news_posts post
      where post.id = post_id
        and post.source = 'club'
        and post.requires_acknowledgement
        and can_read_news_post(post)
    )
  );

