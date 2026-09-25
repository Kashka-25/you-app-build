-- Identity / Vision statements — aspirational self-identity, relationship,
-- and life/work vision declarations (e.g. "I am a Philosopher", "the
-- relationship I want to build toward"). Deliberately NOT goals: no done
-- flag, no XP, nothing to complete — these are a direction to keep
-- orienting toward, not a task. `category` is free text the user assigns
-- themselves (e.g. Relationships, Family, Work, Play/Creative, Recreation,
-- Finances) rather than a fixed enum, so the app's UI can offer suggestions
-- without constraining wording.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.identity_visions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default '',
  title text not null,
  statement text not null,
  reflection text,
  vision_date date not null default current_date,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists identity_visions_user_idx
  on public.identity_visions (user_id, inserted_at desc);

alter table public.identity_visions enable row level security;

drop policy if exists "identity_visions_select_own" on public.identity_visions;
create policy "identity_visions_select_own" on public.identity_visions
  for select using (auth.uid() = user_id);

drop policy if exists "identity_visions_insert_own" on public.identity_visions;
create policy "identity_visions_insert_own" on public.identity_visions
  for insert with check (auth.uid() = user_id);

drop policy if exists "identity_visions_update_own" on public.identity_visions;
create policy "identity_visions_update_own" on public.identity_visions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "identity_visions_delete_own" on public.identity_visions;
create policy "identity_visions_delete_own" on public.identity_visions
  for delete using (auth.uid() = user_id);
