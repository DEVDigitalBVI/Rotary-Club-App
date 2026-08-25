-- Capture the same planning, impact, funding, collaboration, and reporting
-- details used by Rotary International's Service Project Center. The app does
-- not submit to RI; these fields make the final transfer accurate and quick.
alter table service_projects alter column starts_at drop not null;

alter table service_projects
  add column detailed_description text,
  add column language text not null default 'English',
  add column area_of_focus text,
  add column categories text[] not null default '{}',
  add column tags text[] not null default '{}',
  add column address text,
  add column city text,
  add column territory text,
  add column country text not null default 'British Virgin Islands',
  add column community_assessment text,
  add column project_impact text,
  add column sustainability_plan text,
  add column currency text not null default 'USD' check (char_length(currency) = 3),
  add column estimated_budget numeric(12,2) check (estimated_budget is null or estimated_budget >= 0),
  add column amount_pledged numeric(12,2) check (amount_pledged is null or amount_pledged >= 0),
  add column cash_contributions numeric(12,2) check (cash_contributions is null or cash_contributions >= 0),
  add column in_kind_contributions numeric(12,2) check (in_kind_contributions is null or in_kind_contributions >= 0),
  add column is_rotary_grant boolean not null default false,
  add column grant_type text,
  add column grant_number text,
  add column grant_amount numeric(12,2) check (grant_amount is null or grant_amount >= 0),
  add column collaboration_needs text[] not null default '{}',
  add column partner_organizations text[] not null default '{}',
  add column project_contacts text[] not null default '{}',
  add column related_links text[] not null default '{}',
  add column video_links text[] not null default '{}',
  add column cover_image_url text,
  add column beneficiaries_reached integer check (beneficiaries_reached is null or beneficiaries_reached >= 0),
  add column ri_project_id text,
  add column ri_project_url text,
  add column ri_uploaded_at date;
