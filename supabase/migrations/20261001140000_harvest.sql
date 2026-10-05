-- Harvest — the end-of-week look back that closes Sow · Tend · Harvest.
--
-- items.released_at:        a pursuit "released, with thanks" at Harvest.
--                           Archived, not deleted: it leaves Pursue, Sow and
--                           Home, keeps its history and XP, and can be
--                           restored from Pursue → Released.
-- week_intentions.outcome:  what the Seeker chose for each sown intention at
--                           Harvest — carried forward, rested, or released.
-- week_harvests:            one row per harvested week (so the gentle
--                           "harvest your week" prompt knows it's done), plus
--                           an optional "something to remember" note that can
--                           later feed Seasons, Chapters and The Mirror.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

alter table public.items
  add column if not exists released_at timestamptz;

alter table public.week_intentions
  add column if not exists outcome text
  check (outcome is null or outcome in ('carried', 'rested', 'released'));

create table if not exists public.week_harvests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.week_harvests enable row level security;

drop policy if exists "week_harvests_select_own" on public.week_harvests;
create policy "week_harvests_select_own" on public.week_harvests
  for select using (auth.uid() = user_id);

drop policy if exists "week_harvests_insert_own" on public.week_harvests;
create policy "week_harvests_insert_own" on public.week_harvests
  for insert with check (auth.uid() = user_id);

drop policy if exists "week_harvests_update_own" on public.week_harvests;
create policy "week_harvests_update_own" on public.week_harvests
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "week_harvests_delete_own" on public.week_harvests;
create policy "week_harvests_delete_own" on public.week_harvests
  for delete using (auth.uid() = user_id);
