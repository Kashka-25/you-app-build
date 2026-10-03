-- The Compass — the Seeker's own order of their values for this season,
-- found at the Crossroads (two values at a time), plus their compass line:
-- one sentence, in their words, about how they want to live.
--
-- One row per walk of the Crossroads. The latest is the current compass;
-- earlier ones are kept, so the Mirror can later show how it has shifted.
-- ordering: groups, first = True North, e.g. [["Family"],["Freedom","Courage"],["Rest"]]
--   (values in one group were felt as equal).
-- hardest: the crossing that took longest, {"pair":["Freedom","Family"],"seconds":11}.
-- compass_line can be written later, so the latest row may be updated.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.value_compass (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ordering jsonb not null,
  compass_line text,
  hardest jsonb,
  crossings int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists value_compass_user_created_idx on public.value_compass (user_id, created_at desc);

alter table public.value_compass enable row level security;

drop policy if exists "value_compass_select_own" on public.value_compass;
create policy "value_compass_select_own" on public.value_compass for select using (auth.uid() = user_id);
drop policy if exists "value_compass_insert_own" on public.value_compass;
create policy "value_compass_insert_own" on public.value_compass for insert with check (auth.uid() = user_id);
drop policy if exists "value_compass_update_own" on public.value_compass;
create policy "value_compass_update_own" on public.value_compass for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "value_compass_delete_own" on public.value_compass;
create policy "value_compass_delete_own" on public.value_compass for delete using (auth.uid() = user_id);
