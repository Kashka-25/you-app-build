-- Values System, part 1 (Sep 28) — foundation for the approved direction in
-- web-next/BUILD-BACKLOG.md ("Values System + Questionnaires").
--
--   1. values_library   — the shared library (read-only to everyone). Seeded
--                          with the 13 values the app already uses; the 40
--                          main values from The ValYOU's Codex replace/extend
--                          this later.
--   2. user_values      — extended: active/rested status, the Seeker's own
--                          definition (+ history), highest tier ever reached.
--   3. reflections      — Light & Shadow answers and other value reflections.
--                          The most intimate data in the app: owner-only RLS,
--                          never read by analytics.
--   4. entitlements     — premium stub (always false for now). Values are
--                          never paywalled; this only gates AI depth later.
--
-- Additive only: no existing column is dropped or renamed. Safe to re-run.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

-- ── 1. values_library ────────────────────────────────────────────────────
create table if not exists public.values_library (
  slug text primary key,
  name text not null unique,
  element text not null check (element in ('Water','Fire','Earth','Air','Ether')),
  essence text not null default '',
  light text not null default '',
  shadow text not null default '',   -- excess
  void text not null default '',     -- deficiency
  pillars text[] not null default '{}',
  balancing_kin text[] not null default '{}',
  nourishing_kin text[] not null default '{}',
  synonyms text[] not null default '{}',
  parent_slug text references public.values_library(slug),  -- set on sub-values
  inserted_at timestamptz not null default now()
);

alter table public.values_library enable row level security;

drop policy if exists "values_library_read_all" on public.values_library;
create policy "values_library_read_all" on public.values_library
  for select using (true);
-- No insert/update/delete policies: the library is written by migrations only.

-- Elements are a first proposal for the existing 13 — the Codex is the
-- source of truth and will overwrite these.
insert into public.values_library (slug, name, element, essence, pillars) values
  ('communication', 'Communication', 'Air',   'The art of being truly heard and truly listening',  '{Connection}'),
  ('curiosity',     'Curiosity',     'Air',   'The aliveness of not-knowing - leaning in',                           '{Mind,Play}'),
  ('courage',       'Courage',       'Fire',  'The willingness to act in the presence of fear',    '{Spirit}'),
  ('discipline',    'Discipline',    'Fire',  'The practice of choosing yourself - every day',     '{Body,Purpose}'),
  ('creativity',    'Creativity',    'Fire',  'Making something from nothing - again and again',               '{Play}'),
  ('boundaries',    'Boundaries',    'Earth', 'Knowing where you end and where others begin',      '{Connection}'),
  ('integrity',     'Integrity',     'Earth', 'Being the same person in every room',               '{Purpose}'),
  ('family',        'Family',        'Earth', 'The people who knew you before you knew yourself',         '{Connection}'),
  ('empathy',       'Empathy',       'Water', 'The capacity to feel into another''s world',                         '{Connection,Heart}'),
  ('vulnerability', 'Vulnerability', 'Water', 'The strength to be seen - fully and honestly',                '{Heart}'),
  ('rest',          'Rest',          'Water', 'The sacred art of doing nothing - fully',                       '{Body}'),
  ('presence',      'Presence',      'Ether', 'Being fully here - in body, mind, and soul',        '{Mind}'),
  ('gratitude',     'Gratitude',     'Ether', 'Finding the sacred in the ordinary',                     '{Spirit}')
on conflict (slug) do nothing;

-- ── 2. user_values ───────────────────────────────────────────────────────
alter table public.user_values
  add column if not exists status text not null default 'active',
  add column if not exists definition text,
  add column if not exists definition_history jsonb not null default '[]'::jsonb,
  add column if not exists highest_tier_reached integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.user_values
    add constraint user_values_status_check check (status in ('active','rested'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.user_values
    add constraint user_values_highest_tier_check check (highest_tier_reached between 0 and 3);
exception when duplicate_object then null; end $$;

-- Backfill: 0 Awakening · 1 Practising · 2 Embodying · 3 Mastering.
-- A value that has ever prestiged has passed through every tier.
update public.user_values
set highest_tier_reached = case
  when coalesce(prestige, 0) > 0 then 3
  when rating >= 76 then 3
  when rating >= 51 then 2
  when rating >= 26 then 1
  else 0
end
where highest_tier_reached = 0;

-- ── 3. reflections ───────────────────────────────────────────────────────
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value_name text,                 -- null for reflections not tied to a value
  kind text not null check (kind in ('light','shadow','void','integration','definition','freeform')),
  prompt text,
  body text not null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reflections_user_idx
  on public.reflections (user_id, inserted_at desc);

alter table public.reflections enable row level security;

drop policy if exists "reflections_select_own" on public.reflections;
create policy "reflections_select_own" on public.reflections
  for select using (auth.uid() = user_id);

drop policy if exists "reflections_insert_own" on public.reflections;
create policy "reflections_insert_own" on public.reflections
  for insert with check (auth.uid() = user_id);

drop policy if exists "reflections_update_own" on public.reflections;
create policy "reflections_update_own" on public.reflections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reflections_delete_own" on public.reflections;
create policy "reflections_delete_own" on public.reflections
  for delete using (auth.uid() = user_id);

-- ── 4. entitlements ──────────────────────────────────────────────────────
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- Read-only to the owner. Only the service role (a future billing webhook)
-- may write, so nobody can grant themselves premium from the client.
drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own" on public.entitlements
  for select using (auth.uid() = user_id);

notify pgrst, 'reload schema';
