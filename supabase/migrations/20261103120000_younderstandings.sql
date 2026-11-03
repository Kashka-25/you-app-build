-- Readings a Seeker chose to keep from Ask YOU in YOUnderstanding
-- (Cassidy, Nov 2). One row per kept answer: their question, YOU's
-- reading (title, opening, sections, echoes, question, step) and what it
-- drew from. Listed newest first; the Seeker can delete any of them.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.younderstandings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer jsonb not null,
  drew_from jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists younderstandings_user_created_idx on public.younderstandings (user_id, created_at desc);

alter table public.younderstandings enable row level security;
drop policy if exists "younderstandings_own" on public.younderstandings;
create policy "younderstandings_own" on public.younderstandings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
