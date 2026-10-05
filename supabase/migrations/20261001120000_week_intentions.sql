-- Sow · Tend · Harvest — one row per pursuit the Seeker has "sown" for a
-- given week (Monday-start). Deliberately its own table rather than columns
-- on `items`: an item can be sown in many weeks, and each week keeps its own
-- day plan, chosen Value, and which days it was actually tended.
--
-- days:          weekdays it's planned for, 0 = Mon … 6 = Sun.
--                Empty = "sometime this week".
-- tended_dates:  local dates it was tended (drives "tended on N days").
-- rested_dates:  local dates the Seeker chose "rest today" — hidden that
--                day, no lost progress.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.week_intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  week_start date not null,
  days smallint[] not null default '{}',
  value_name text,
  tended_dates date[] not null default '{}',
  rested_dates date[] not null default '{}',
  inserted_at timestamptz not null default now(),
  unique (user_id, week_start, item_id)
);

create index if not exists week_intentions_user_week_idx
  on public.week_intentions (user_id, week_start);

alter table public.week_intentions enable row level security;

drop policy if exists "week_intentions_select_own" on public.week_intentions;
create policy "week_intentions_select_own" on public.week_intentions
  for select using (auth.uid() = user_id);

drop policy if exists "week_intentions_insert_own" on public.week_intentions;
create policy "week_intentions_insert_own" on public.week_intentions
  for insert with check (auth.uid() = user_id);

drop policy if exists "week_intentions_update_own" on public.week_intentions;
create policy "week_intentions_update_own" on public.week_intentions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "week_intentions_delete_own" on public.week_intentions;
create policy "week_intentions_delete_own" on public.week_intentions
  for delete using (auth.uid() = user_id);
