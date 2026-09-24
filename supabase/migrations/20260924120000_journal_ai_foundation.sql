-- Journal AI foundation — extends the bare journal_entries table (content,
-- mood, entry_date only) into the backbone of the Life Atlas memory system:
-- photos + transcription, tags, AI-generated (and user-editable/rejectable)
-- insights per entry, and stored weekly reflections.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run), same as the two
-- migrations before it.

-- 1. Tags on journal entries (optional, user-authored — distinct from the
--    AI-suggested "themes" which live in journal_ai_insights below).
alter table public.journal_entries
  add column if not exists tags text[] not null default '{}';

-- 2. Photos of handwritten pages. One entry can have several; each photo
--    carries its own transcription so editing one page's text never
--    clobbers another's. Kept as its own table (not a column on
--    journal_entries) for the same reason life_moments' photo lives in
--    storage rather than inline: images don't belong in a row you fetch on
--    every app load.
create table if not exists public.journal_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  transcription text,
  transcription_status text not null default 'pending'
    check (transcription_status in ('pending', 'done', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists journal_photos_entry_idx
  on public.journal_photos (entry_id);

alter table public.journal_photos enable row level security;

drop policy if exists "journal_photos_select_own" on public.journal_photos;
create policy "journal_photos_select_own" on public.journal_photos
  for select using (auth.uid() = user_id);

drop policy if exists "journal_photos_insert_own" on public.journal_photos;
create policy "journal_photos_insert_own" on public.journal_photos
  for insert with check (auth.uid() = user_id);

drop policy if exists "journal_photos_update_own" on public.journal_photos;
create policy "journal_photos_update_own" on public.journal_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "journal_photos_delete_own" on public.journal_photos;
create policy "journal_photos_delete_own" on public.journal_photos
  for delete using (auth.uid() = user_id);

-- Private storage bucket for journal photos, same shape as the existing
-- life-moments bucket: path is "{user_id}/{filename}", RLS checks the first
-- path segment matches the caller.
insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

drop policy if exists "journal_photos_storage_select_own" on storage.objects;
create policy "journal_photos_storage_select_own" on storage.objects
  for select using (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "journal_photos_storage_insert_own" on storage.objects;
create policy "journal_photos_storage_insert_own" on storage.objects
  for insert with check (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "journal_photos_storage_delete_own" on storage.objects;
create policy "journal_photos_storage_delete_own" on storage.objects
  for delete using (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3. AI insight per entry. One row per entry (regenerating replaces it —
--    same "review before it's kept" spirit as suggest-chapters, just
--    already-saved rather than pending). `insights` is a flat array of
--    { id, category, text, status } items — status is 'ai' | 'edited' |
--    'rejected' so the UI can always show what the user wrote vs. what the
--    AI inferred, and a rejected item is kept (not deleted) for audit
--    rather than silently vanishing. `connections` links the entry back
--    into the rest of the Life Atlas (values/goals/dreams/challenges/life
--    areas/moments/chapters/other entries) as plain names/ids — no
--    separate junction tables needed for an MVP where the AI is proposing
--    connections, not enforcing referential integrity.
create table if not exists public.journal_ai_insights (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null unique references public.journal_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text,
  insights jsonb not null default '[]',
  connections jsonb not null default '{}',
  reflection_question text,
  suggested_next_step text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_ai_insights enable row level security;

drop policy if exists "journal_ai_insights_select_own" on public.journal_ai_insights;
create policy "journal_ai_insights_select_own" on public.journal_ai_insights
  for select using (auth.uid() = user_id);

drop policy if exists "journal_ai_insights_insert_own" on public.journal_ai_insights;
create policy "journal_ai_insights_insert_own" on public.journal_ai_insights
  for insert with check (auth.uid() = user_id);

drop policy if exists "journal_ai_insights_update_own" on public.journal_ai_insights;
create policy "journal_ai_insights_update_own" on public.journal_ai_insights
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "journal_ai_insights_delete_own" on public.journal_ai_insights;
create policy "journal_ai_insights_delete_own" on public.journal_ai_insights
  for delete using (auth.uid() = user_id);

-- 4. Weekly reflections — stored so a past week's review doesn't silently
--    change underneath the user, and so "regenerate" is a conscious choice
--    (upsert on user_id + week_start) rather than something that happens
--    on every screen visit.
create table if not exists public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  sections jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.weekly_reflections enable row level security;

drop policy if exists "weekly_reflections_select_own" on public.weekly_reflections;
create policy "weekly_reflections_select_own" on public.weekly_reflections
  for select using (auth.uid() = user_id);

drop policy if exists "weekly_reflections_insert_own" on public.weekly_reflections;
create policy "weekly_reflections_insert_own" on public.weekly_reflections
  for insert with check (auth.uid() = user_id);

drop policy if exists "weekly_reflections_update_own" on public.weekly_reflections;
create policy "weekly_reflections_update_own" on public.weekly_reflections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weekly_reflections_delete_own" on public.weekly_reflections;
create policy "weekly_reflections_delete_own" on public.weekly_reflections
  for delete using (auth.uid() = user_id);
