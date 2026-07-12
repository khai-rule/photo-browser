-- Migration 003: Albums table + album_id FK on images
-- Run this in the Supabase Dashboard SQL Editor (or via Supabase CLI).

-- ── Albums table ────────────────────────────────────────────────────────────

create table if not exists albums (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users not null,
  name       text        not null,
  created_at timestamptz default now()
);

alter table albums enable row level security;

create policy "Users can select own albums"
  on albums for select
  using (auth.uid() = user_id);

create policy "Users can insert own albums"
  on albums for insert
  with check (auth.uid() = user_id);

create policy "Users can update own albums"
  on albums for update
  using (auth.uid() = user_id);

create policy "Users can delete own albums"
  on albums for delete
  using (auth.uid() = user_id);

-- ── album_id FK on images ────────────────────────────────────────────────────
-- Nullable: an image may or may not belong to an album.
-- on delete set null: deleting an album does NOT delete its images.

alter table images
  add column if not exists album_id uuid
  references albums(id)
  on delete set null;

-- ── UPDATE policy on images (was missing) ────────────────────────────────────
-- Required so the app can assign / un-assign album_id.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'images'
      and policyname = 'Users can update own images'
  ) then
    execute $policy$
      create policy "Users can update own images"
        on images for update
        using (auth.uid() = user_id)
    $policy$;
  end if;
end;
$$;
