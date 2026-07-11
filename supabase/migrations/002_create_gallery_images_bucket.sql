-- Migration: 002_create_gallery_images_bucket
-- Creates the private storage bucket used by local uploads and preview signed URLs.

insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists "Gallery images are readable by owner" on storage.objects;
create policy "Gallery images are readable by owner"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'gallery-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Gallery images are insertable by owner" on storage.objects;
create policy "Gallery images are insertable by owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'gallery-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Gallery images are deletable by owner" on storage.objects;
create policy "Gallery images are deletable by owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'gallery-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );