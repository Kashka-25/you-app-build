-- A reading across every dream a Seeker has recorded (Cassidy, Oct 27:
-- "reflect upon all recorded dreams for patterns"). One row per Seeker,
-- replaced each time they ask for a fresh reading.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.dream_patterns (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reading jsonb not null,
  dream_count integer not null default 0,
  first_dream date,
  last_dream date,
  updated_at timestamptz not null default now()
);

alter table public.dream_patterns enable row level security;
drop policy if exists "dream_patterns_own" on public.dream_patterns;
create policy "dream_patterns_own" on public.dream_patterns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
