-- ==============================================================================
-- TABLE: teacher_media (Koleksi Foto & Galeri Media Soal Guru per User ID)
-- ==============================================================================
create table if not exists public.teacher_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_email text not null,
  file_name text not null,
  file_size integer not null default 0,
  mime_type text not null default 'image/jpeg',
  file_url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexing for rapid queries per user / email
create index if not exists idx_teacher_media_user on public.teacher_media(user_id);
create index if not exists idx_teacher_media_email on public.teacher_media(user_email);

-- Enable Row Level Security (RLS)
alter table public.teacher_media enable row level security;

-- Drop existing policies if any
drop policy if exists "Teachers can view own media" on public.teacher_media;
drop policy if exists "Teachers can insert own media" on public.teacher_media;
drop policy if exists "Teachers can update own media" on public.teacher_media;
drop policy if exists "Teachers can delete own media" on public.teacher_media;
drop policy if exists "Public read media" on public.teacher_media;

-- Allow authenticated users to manage their own media
create policy "Teachers can view own media"
  on public.teacher_media for select
  using (auth.uid() = user_id or auth.jwt()->>'email' = user_email);

create policy "Teachers can insert own media"
  on public.teacher_media for insert
  with check (auth.uid() = user_id or auth.jwt()->>'email' = user_email);

create policy "Teachers can update own media"
  on public.teacher_media for update
  using (auth.uid() = user_id or auth.jwt()->>'email' = user_email);

create policy "Teachers can delete own media"
  on public.teacher_media for delete
  using (auth.uid() = user_id or auth.jwt()->>'email' = user_email);

-- Allow public read so student exam sheets and preview modals can render images
create policy "Public read media"
  on public.teacher_media for select
  using (true);
