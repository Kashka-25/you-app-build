-- Seasons — the emotional/growth season the Seeker seems to be in
-- ("Season of Letting Go"), read by the infer-season Edge Function from
-- their recent Harvests (notes, and what they carried, rested and
-- released), with weekly reflections as extra context. Replaces the old
-- hard-coded preview card.
--
-- One row per reading. The latest is the current season; earlier ones are
-- kept, so seasons can later sit along the Story of You / Chapters.
-- based_on: what the reading drew from (counts and the date range), shown
-- back to the Seeker so it's never a black box.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  blurb text not null default '',
  signals jsonb not null default '[]'::jsonb,
  based_on jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists seasons_user_created_idx on public.seasons (user_id, created_at desc);

alter table public.seasons enable row level security;

drop policy if exists "seasons_select_own" on public.seasons;
create policy "seasons_select_own" on public.seasons for select using (auth.uid() = user_id);
drop policy if exists "seasons_insert_own" on public.seasons;
create policy "seasons_insert_own" on public.seasons for insert with check (auth.uid() = user_id);
drop policy if exists "seasons_delete_own" on public.seasons;
create policy "seasons_delete_own" on public.seasons for delete using (auth.uid() = user_id);
