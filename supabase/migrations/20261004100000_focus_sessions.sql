-- Focus sessions — the "Tend" timer. A flower grows while the Seeker works
-- on something; stopping early leaves a resting seed, never a dead plant.
-- Each finished or rested session is one row, and grows in the garden
-- around the Tree of YOU and in that week's Harvest.
--
-- item_id / intention_id: what was tended (both optional: "just focus").
-- label: what it was called at the time, so the garden still reads well if
--   the pursuit is later renamed or released.
-- planned_minutes: null for an open session (no end).
-- outcome: 'bloom' (reached its time, or an open session stopped after the
--   first marker) or 'seed' (rested early).
-- xp: focus XP from the markers reached (also logged to memory, which is
--   what Pillar roots read).
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  intention_id uuid references public.week_intentions(id) on delete set null,
  label text not null,
  pillar text,
  value_name text,
  planned_minutes int,
  minutes int not null default 0,
  outcome text not null check (outcome in ('bloom', 'seed')),
  note text,
  xp int not null default 0,
  started_at timestamptz not null,
  ended_at timestamptz not null default now(),
  date_key date not null
);

create index if not exists focus_sessions_user_date_idx on public.focus_sessions (user_id, date_key desc);

alter table public.focus_sessions enable row level security;

drop policy if exists "focus_sessions_select_own" on public.focus_sessions;
create policy "focus_sessions_select_own" on public.focus_sessions for select using (auth.uid() = user_id);
drop policy if exists "focus_sessions_insert_own" on public.focus_sessions;
create policy "focus_sessions_insert_own" on public.focus_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "focus_sessions_update_own" on public.focus_sessions;
create policy "focus_sessions_update_own" on public.focus_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "focus_sessions_delete_own" on public.focus_sessions;
create policy "focus_sessions_delete_own" on public.focus_sessions for delete using (auth.uid() = user_id);
