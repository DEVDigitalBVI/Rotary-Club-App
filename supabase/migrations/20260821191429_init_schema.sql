-- Initial schema for members, committees, events, and news.
--
-- Deliberately excludes invoices/payments (mirrored read-only from
-- QuickBooks Online — a sync concern, not something this app writes) and
-- chat (not in scope for this pass). See lib/mock-data.ts for the shapes
-- this schema is modeled on.
--
-- Permission checks that already exist as predicates in lib/mock-data.ts
-- (canPostNews, canManageEvents, canAddMembers, committeeManageRight) are
-- reproduced here as SQL helper functions and enforced via RLS, so the
-- database — not just the UI — refuses writes the app wouldn't allow.
-- These depend on members.user_id being linked to a real auth.users row;
-- until real auth is wired up, current_member_id() returns null for every
-- request, so every officer-gated write policy denies by default rather
-- than failing open.

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------

create table members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  email text not null unique,
  phone text,
  classification text,
  join_date date not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'honorary')),
  role text not null default 'member' check (role in ('member', 'admin')),
  position text check (position in ('president', 'president-elect', 'secretary', 'treasurer')),
  bio text,
  avatar_color text,
  avatar_url text,
  -- Foundation recognition: a giving record, not member-editable (see
  -- can_edit_recognition below). Defaults mirror lib/mock-data.ts's
  -- emptyRecognition so an absent record and a zeroed one read the same.
  paul_harris_count integer not null default 0,
  polio_plus_society boolean not null default false,
  action_groups text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one member holds each elected office at a time.
create unique index members_position_unique on members (position) where position is not null;

create trigger members_set_updated_at
  before update on members
  for each row execute function set_updated_at();

alter table members enable row level security;

-- ---------------------------------------------------------------------------
-- Committees
-- ---------------------------------------------------------------------------

create table committees (
  id text primary key,
  name text not null,
  description text,
  -- Absent on the Board, which the President chairs ex officio.
  director_id uuid references members (id) on delete set null,
  managed_by text not null check (managed_by in ('director', 'officers')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index committees_director_id_idx on committees (director_id);

create trigger committees_set_updated_at
  before update on committees
  for each row execute function set_updated_at();

alter table committees enable row level security;

create table committee_members (
  committee_id text not null references committees (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  primary key (committee_id, member_id)
);

create index committee_members_member_id_idx on committee_members (member_id);

alter table committee_members enable row level security;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  is_virtual boolean not null default false,
  description text,
  speaker_name text,
  speaker_topic text,
  rsvp_deadline date,
  -- Post-meeting head count, entered once, not a per-member log.
  attendance_present integer,
  attendance_total integer,
  flyer_url text,
  flyer_alt text,
  agenda_file_name text,
  agenda_url text,
  agenda_uploaded_at timestamptz,
  agenda_size_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_starts_at_idx on events (starts_at);

create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();

alter table events enable row level security;

create table event_rsvps (
  event_id uuid not null references events (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')),
  responded_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index event_rsvps_member_id_idx on event_rsvps (member_id);

alter table event_rsvps enable row level security;

-- ---------------------------------------------------------------------------
-- News
-- ---------------------------------------------------------------------------

create table news_posts (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('club', 'district', 'ri')),
  title text not null,
  body text not null,
  author text not null,
  -- Populated for club posts; null for syndicated items, which are
  -- attributed to the source organization rather than a member.
  author_member_id uuid references members (id) on delete set null,
  published_at date not null,
  image_url text,
  image_alt text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- District/RI items are summaries of someone else's article and always
  -- link back to it; only club posts may omit a source_url.
  constraint news_posts_syndicated_has_source_url
    check (source = 'club' or source_url is not null)
);

create index news_posts_source_published_idx on news_posts (source, published_at desc);
create index news_posts_author_member_id_idx on news_posts (author_member_id);

create trigger news_posts_set_updated_at
  before update on news_posts
  for each row execute function set_updated_at();

alter table news_posts enable row level security;

-- ---------------------------------------------------------------------------
-- Permission helpers, mirroring lib/mock-data.ts
-- ---------------------------------------------------------------------------

-- auth.uid() is wrapped in a select so the planner evaluates it once per
-- statement rather than once per row (Supabase's RLS initplan guidance).
create or replace function current_member_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select id from members where user_id = (select auth.uid());
$$;

-- canPostNews(): any board member (officers + every committee director).
create or replace function is_board_member()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from committee_members
    where committee_id = 'board' and member_id = current_member_id()
  );
$$;

-- runsTheClub(): President, Secretary, or the Club Administration director.
-- Backs canAddMembers() and canManageEvents().
create or replace function runs_the_club()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    exists (
      select 1 from members
      where id = current_member_id() and position in ('president', 'secretary')
    )
    or exists (
      select 1 from committees
      where id = 'club-administration' and director_id = current_member_id()
    );
$$;

-- canEditRecognition(): Secretary or the Foundation director.
create or replace function can_edit_recognition()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    exists (
      select 1 from members
      where id = current_member_id() and position = 'secretary'
    )
    or exists (
      select 1 from committees
      where id = 'foundation' and director_id = current_member_id()
    );
$$;

-- committeeManageRight(): that committee's own director, or the
-- President/Secretary overriding on their behalf.
create or replace function can_manage_committee(target_committee_id text)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    exists (
      select 1 from committees
      where id = target_committee_id and director_id = current_member_id()
    )
    or exists (
      select 1 from members
      where id = current_member_id() and position in ('president', 'secretary')
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

-- Members: directory is visible to any signed-in member. Anyone may create
-- their own row via self-signup later; officers can add on others' behalf.
-- Self-edit covers the profile fields a member owns; note this does not
-- separately lock down paul_harris_count/polio_plus_society/action_groups
-- to can_edit_recognition() — that needs column-level enforcement (a
-- trigger, or splitting recognition into its own table) if it turns out to
-- matter before the UI-layer check is trusted.
create policy "members_select" on members for select to authenticated using (true);
create policy "members_insert" on members for insert to authenticated
  with check (runs_the_club() or user_id = (select auth.uid()));
create policy "members_update" on members for update to authenticated
  using (id = current_member_id() or runs_the_club())
  with check (id = current_member_id() or runs_the_club());

-- Committees: structure is visible to everyone signed in; only the people
-- who run the club edit it (fixed six committees are seeded below). Insert/
-- update/delete are split out (rather than a single "for all" policy) so
-- they don't also apply — and double-evaluate — on plain SELECT queries.
create policy "committees_select" on committees for select to authenticated using (true);
create policy "committees_insert" on committees for insert to authenticated with check (runs_the_club());
create policy "committees_update" on committees for update to authenticated using (runs_the_club()) with check (runs_the_club());
create policy "committees_delete" on committees for delete to authenticated using (runs_the_club());

-- Committee rosters: readable by all; editable by that committee's director
-- or an officer overriding, matching committeeManageRight() exactly.
create policy "committee_members_select" on committee_members for select to authenticated using (true);
create policy "committee_members_insert" on committee_members for insert to authenticated with check (can_manage_committee(committee_id));
create policy "committee_members_update" on committee_members for update to authenticated using (can_manage_committee(committee_id)) with check (can_manage_committee(committee_id));
create policy "committee_members_delete" on committee_members for delete to authenticated using (can_manage_committee(committee_id));

-- Events: visible to all; managed by whoever runs the meetings.
create policy "events_select" on events for select to authenticated using (true);
create policy "events_insert" on events for insert to authenticated with check (runs_the_club());
create policy "events_update" on events for update to authenticated using (runs_the_club()) with check (runs_the_club());
create policy "events_delete" on events for delete to authenticated using (runs_the_club());

-- RSVPs: visible to all (for headcounts); each member manages only their own.
create policy "event_rsvps_select" on event_rsvps for select to authenticated using (true);
create policy "event_rsvps_insert" on event_rsvps for insert to authenticated with check (member_id = current_member_id());
create policy "event_rsvps_update" on event_rsvps for update to authenticated using (member_id = current_member_id()) with check (member_id = current_member_id());
create policy "event_rsvps_delete" on event_rsvps for delete to authenticated using (member_id = current_member_id());

-- News: visible to all; club posts are written and corrected by board
-- members only (canPostNews's rationale — a wrong post is a board post).
create policy "news_posts_select" on news_posts for select to authenticated using (true);
create policy "news_posts_insert" on news_posts for insert to authenticated with check (is_board_member());
create policy "news_posts_update" on news_posts for update to authenticated using (is_board_member()) with check (is_board_member());
create policy "news_posts_delete" on news_posts for delete to authenticated using (is_board_member());

-- ---------------------------------------------------------------------------
-- Seed: the club's fixed standing committees (structure, not member data —
-- actual rosters and directors are assigned once real members exist).
-- ---------------------------------------------------------------------------

insert into committees (id, name, description, managed_by) values
  ('board', 'Board of Directors', 'The club officers and committee directors.', 'officers'),
  ('youth-service', 'Youth Service', 'Interact, Rotaract, RYLA, and youth exchange.', 'director'),
  ('membership', 'Membership', 'Recruiting, proposing, and retaining members.', 'director'),
  ('club-administration', 'Club Administration', 'Meetings, hospitality, and running the club week to week.', 'director'),
  ('foundation', 'Foundation', 'Rotary Foundation giving, grants, and PolioPlus.', 'director'),
  ('community-service', 'Community Service', 'Local projects and hands-on service across the territory.', 'director');
