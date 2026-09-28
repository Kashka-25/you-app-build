-- Today's list — quick one-off things for today only, added from the Add
-- sheet. Deliberately NOT `items`: no Pillar, no XP, no streaks, never shown
-- in Pursue. A to-do belongs to the day it was written for; the app only
-- shows today's, so unfinished ones quietly fall away rather than piling up
-- as an overdue list (no pressure cues).
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  todo_date date not null default current_date,
  done boolean not null default false,
  inserted_at timestamptz not null default now()
);

create index if not exists todos_user_date_idx
  on public.todos (user_id, todo_date);

alter table public.todos enable row level security;

drop policy if exists "todos_select_own" on public.todos;
create policy "todos_select_own" on public.todos
  for select using (auth.uid() = user_id);

drop policy if exists "todos_insert_own" on public.todos;
create policy "todos_insert_own" on public.todos
  for insert with check (auth.uid() = user_id);

drop policy if exists "todos_update_own" on public.todos;
create policy "todos_update_own" on public.todos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "todos_delete_own" on public.todos;
create policy "todos_delete_own" on public.todos
  for delete using (auth.uid() = user_id);
