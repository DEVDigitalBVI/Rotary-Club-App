-- Member profile photos are deliberately separate from event materials:
-- smaller image-only uploads, public reads for stable directory avatar URLs,
-- and writes scoped to the member's own folder (or existing club officers).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_photos_read" on storage.objects
  for select
  using (bucket_id = 'profile-photos');

create policy "profile_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = public.current_member_id()::text
      or public.runs_the_club()
    )
  );

create policy "profile_photos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = public.current_member_id()::text
      or public.runs_the_club()
    )
  )
  with check (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = public.current_member_id()::text
      or public.runs_the_club()
    )
  );

create policy "profile_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = public.current_member_id()::text
      or public.runs_the_club()
    )
  );
