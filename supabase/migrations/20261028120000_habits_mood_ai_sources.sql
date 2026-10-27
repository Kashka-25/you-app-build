-- Three builds from Cassidy's Oct 27 notes, in one go.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

-- ── 7. Habit steps that start fresh each day, with amounts ───────────────
-- A habit's steps (items.milestones, each now with an id, and an optional
-- amount + unit, e.g. 100 push-ups) are ticked per day here. A habit with
-- no steps can have its own daily amount (items.daily_target, e.g.
-- 30 minutes). `amount` is what was actually done that day, so 150 push-ups
-- or an hour instead of 30 minutes is kept as it was.
alter table public.items add column if not exists daily_target jsonb;

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  day date not null,
  step text not null default 'habit',
  amount numeric check (amount is null or amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists habit_logs_one_per_day on public.habit_logs (item_id, day, step);
create index if not exists habit_logs_user_idx on public.habit_logs (user_id, day);

alter table public.habit_logs enable row level security;
drop policy if exists "habit_logs_own" on public.habit_logs;
create policy "habit_logs_own" on public.habit_logs
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid())
  );

-- ── 8. Mood as a 0–100 scale ─────────────────────────────────────────────
-- `mood` (the five words) stays, worked out from the score, so everything
-- that already reads it keeps working.
alter table public.mood_log add column if not exists score smallint
  check (score is null or (score between 0 and 100));

-- ── 9. What the AI may read ──────────────────────────────────────────────
-- Each Seeker chooses which parts of YOU the AI features may draw on.
-- null = not chosen yet, which keeps today's behaviour (everything the
-- features already used: journal, moments, harvests, pursuits, values).
-- Course answers keep their own yes (include_courses).
alter table public.ai_consent add column if not exists sources text[];
