-- Member engagement: service projects, richer event registration, targeted
-- announcements, and self-guided onboarding.

-- ---------------------------------------------------------------------------
-- Service projects and volunteering
-- ---------------------------------------------------------------------------

create table service_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  volunteer_goal integer check (volunteer_goal is null or volunteer_goal > 0),
  hours_goal numeric(8,2) check (hours_goal is null or hours_goal > 0),
  status text not null default 'open' check (status in ('draft', 'open', 'completed', 'cancelled')),
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_projects_starts_at_idx on service_projects (starts_at);
create trigger service_projects_set_updated_at before update on service_projects
  for each row execute function set_updated_at();
alter table service_projects enable row level security;

create policy "service_projects_select" on service_projects for select to authenticated
  using (is_active_club_member());
create policy "service_projects_insert" on service_projects for insert to authenticated
  with check (can_manage_committee('community-service'));
create policy "service_projects_update" on service_projects for update to authenticated
  using (can_manage_committee('community-service')) with check (can_manage_committee('community-service'));
create policy "service_projects_delete" on service_projects for delete to authenticated
  using (can_manage_committee('community-service'));

create table project_volunteers (
  project_id uuid not null references service_projects (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  note text,
  joined_at timestamptz not null default now(),
  primary key (project_id, member_id)
);

alter table project_volunteers enable row level security;
create policy "project_volunteers_select" on project_volunteers for select to authenticated
  using (is_active_club_member());
create policy "project_volunteers_insert" on project_volunteers for insert to authenticated
  with check (member_id = current_member_id());
create policy "project_volunteers_update" on project_volunteers for update to authenticated
  using (member_id = current_member_id()) with check (member_id = current_member_id());
create policy "project_volunteers_delete" on project_volunteers for delete to authenticated
  using (member_id = current_member_id() or can_manage_committee('community-service'));

create table volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references service_projects (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  hours numeric(6,2) not null check (hours > 0 and hours <= 24),
  served_on date not null,
  note text,
  approved_at timestamptz,
  approved_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

create index volunteer_hours_project_idx on volunteer_hours (project_id);
create index volunteer_hours_member_idx on volunteer_hours (member_id);
alter table volunteer_hours enable row level security;
create policy "volunteer_hours_select" on volunteer_hours for select to authenticated
  using (is_active_club_member());
create policy "volunteer_hours_insert" on volunteer_hours for insert to authenticated
  with check (member_id = current_member_id() and approved_at is null and approved_by is null);
create policy "volunteer_hours_update" on volunteer_hours for update to authenticated
  using (can_manage_committee('community-service')) with check (can_manage_committee('community-service'));
create policy "volunteer_hours_delete" on volunteer_hours for delete to authenticated
  using ((member_id = current_member_id() and approved_at is null) or can_manage_committee('community-service'));

-- ---------------------------------------------------------------------------
-- Richer event registration
-- ---------------------------------------------------------------------------

alter table events
  add column capacity integer check (capacity is null or capacity > 0),
  add column allow_guests boolean not null default false,
  add column waitlist_enabled boolean not null default false,
  add column dietary_notes_enabled boolean not null default false;

alter table event_rsvps
  add column guest_count integer not null default 0 check (guest_count between 0 and 10),
  add column dietary_notes text,
  add column registration_status text not null default 'registered'
    check (registration_status in ('registered', 'waitlisted'));

-- ---------------------------------------------------------------------------
-- Targeted announcements
-- ---------------------------------------------------------------------------

alter table news_posts
  add column audience_type text not null default 'all'
    check (audience_type in ('all', 'board', 'committee', 'event')),
  add column audience_id text;

alter table news_posts add constraint news_posts_audience_target
  check ((audience_type in ('all', 'board') and audience_id is null)
    or (audience_type in ('committee', 'event') and audience_id is not null));

create or replace function can_read_news_post(post news_posts)
returns boolean language sql stable set search_path = public as $$
  select case post.audience_type
    when 'all' then is_active_club_member()
    when 'board' then is_board_member()
    when 'committee' then exists (
      select 1 from committee_members
      where committee_id = post.audience_id and member_id = current_member_id()
    )
    when 'event' then exists (
      select 1 from event_rsvps
      where event_id::text = post.audience_id and member_id = current_member_id()
        and status in ('yes', 'maybe')
    )
    else false
  end;
$$;

drop policy if exists "news_posts_select" on news_posts;
create policy "news_posts_select" on news_posts for select to authenticated
  using (can_read_news_post(news_posts));

create or replace function notify_targeted_announcement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source <> 'club' then return new; end if;
  insert into notifications (recipient_id, type, title, body, link)
  select m.id, 'announcement', new.title, left(new.body, 180), '/news'
  from members m
  where m.status = 'active' and m.id <> new.author_member_id and (
    new.audience_type = 'all'
    or (new.audience_type = 'board' and exists (
      select 1 from committee_members cm where cm.committee_id = 'board' and cm.member_id = m.id))
    or (new.audience_type = 'committee' and exists (
      select 1 from committee_members cm where cm.committee_id = new.audience_id and cm.member_id = m.id))
    or (new.audience_type = 'event' and exists (
      select 1 from event_rsvps er where er.event_id::text = new.audience_id
        and er.member_id = m.id and er.status in ('yes', 'maybe')))
  );
  return new;
end;
$$;

create trigger news_posts_notify_target after insert on news_posts
  for each row execute function notify_targeted_announcement();

-- ---------------------------------------------------------------------------
-- Member onboarding
-- ---------------------------------------------------------------------------

create table member_onboarding (
  member_id uuid not null references members (id) on delete cascade,
  task_key text not null check (task_key in ('profile', 'directory', 'committee', 'first-event', 'first-project')),
  completed_at timestamptz not null default now(),
  primary key (member_id, task_key)
);

alter table member_onboarding enable row level security;
create policy "member_onboarding_select" on member_onboarding for select to authenticated
  using (member_id = current_member_id() or runs_the_club());
create policy "member_onboarding_insert" on member_onboarding for insert to authenticated
  with check (member_id = current_member_id());
create policy "member_onboarding_delete" on member_onboarding for delete to authenticated
  using (member_id = current_member_id());
