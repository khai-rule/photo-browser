-- Migration: 001_create_images_table
-- Apply this via the Supabase dashboard SQL Editor or via the Supabase CLI.

create table if not exists images (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references auth.users not null,
  url              text        not null,
  source           text        not null check (source in ('upload', 'gdrive')),
  original_filename text,
  created_at       timestamptz default now()
);

-- Enable Row Level Security
alter table images enable row level security;

-- Policy: users can only select their own rows
create policy "Users can select own images"
  on images
  for select
  using (auth.uid() = user_id);

-- Policy: users can only insert rows for themselves
create policy "Users can insert own images"
  on images
  for insert
  with check (auth.uid() = user_id);

-- Policy: users can only delete their own rows
create policy "Users can delete own images"
  on images
  for delete
  using (auth.uid() = user_id);
