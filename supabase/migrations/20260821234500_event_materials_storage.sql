-- Storage bucket for event flyers and agendas. Public read (these are
-- meeting announcements meant to be shared, per the app's own copy — "the
-- poster members will see and share"), writes restricted to whoever can
-- manage events (runs_the_club(): President, Secretary, or the Club
-- Administration director — same rule as the events table's own RLS).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-materials',
  'event-materials',
  true,
  10485760, -- 10 MB
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "event_materials_read" on storage.objects
  for select
  using (bucket_id = 'event-materials');

create policy "event_materials_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-materials' and runs_the_club());

create policy "event_materials_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'event-materials' and runs_the_club())
  with check (bucket_id = 'event-materials' and runs_the_club());

create policy "event_materials_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-materials' and runs_the_club());
