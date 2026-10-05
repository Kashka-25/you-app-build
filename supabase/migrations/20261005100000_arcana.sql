-- YOUniversity · Arcana (Oct 5).
--
-- An Arcanum is an add-on a Seeker holds in their Library: a questionnaire,
-- a course, a tool. What's inside one (its words, its layout) lives in the
-- app (constants/arcana.js). The database only knows which Arcana exist,
-- which are free, and who holds what.
--
--   1. arcana       — the catalog: slug + free or not. Readable by anyone
--                     signed in; written only by migrations / service role.
--   2. user_arcana  — what each Seeker holds. A Seeker may add a FREE
--                     Arcanum themselves; anything else (a purchase, a gift)
--                     can only be granted by the service role, e.g. a future
--                     payment webhook. So nobody can unlock a paid Arcanum
--                     from the client.
--   3. own_tools    — tools a Seeker picked up along the way (from a book, a
--                     therapist, a friend) and keeps in their Library, with
--                     the days they used them.
--
-- Additive; safe to re-run.
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

-- ── 1. arcana ────────────────────────────────────────────────────────────
create table if not exists public.arcana (
  slug text primary key,
  is_free boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.arcana enable row level security;

drop policy if exists "arcana_select_all" on public.arcana;
create policy "arcana_select_all" on public.arcana
  for select to authenticated using (true);

insert into public.arcana (slug, is_free) values
  ('light-and-shadow', true),
  ('freeing-the-dream', true)
on conflict (slug) do nothing;

-- ── 2. user_arcana ───────────────────────────────────────────────────────
create table if not exists public.user_arcana (
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null references public.arcana(slug) on delete cascade,
  source text not null default 'free' check (source in ('free','purchase','gift')),
  acquired_at timestamptz not null default now(),
  primary key (user_id, slug)
);

alter table public.user_arcana enable row level security;

drop policy if exists "user_arcana_select_own" on public.user_arcana;
create policy "user_arcana_select_own" on public.user_arcana
  for select using (auth.uid() = user_id);

-- Only free, published Arcana can be added from the app.
drop policy if exists "user_arcana_insert_free" on public.user_arcana;
create policy "user_arcana_insert_free" on public.user_arcana
  for insert with check (
    auth.uid() = user_id
    and source = 'free'
    and exists (select 1 from public.arcana a where a.slug = user_arcana.slug and a.is_free and a.published)
  );

-- A free Arcanum can be put back; a bought one can't be lost by accident.
drop policy if exists "user_arcana_delete_free" on public.user_arcana;
create policy "user_arcana_delete_free" on public.user_arcana
  for delete using (auth.uid() = user_id and source = 'free');

-- ── 3. own_tools ─────────────────────────────────────────────────────────
create table if not exists public.own_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  learned_from text check (char_length(learned_from) <= 200),
  purpose text check (char_length(purpose) <= 1000),
  how text check (char_length(how) <= 4000),
  used_dates date[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists own_tools_user_idx on public.own_tools (user_id, created_at desc);

alter table public.own_tools enable row level security;

drop policy if exists "own_tools_all_own" on public.own_tools;
create policy "own_tools_all_own" on public.own_tools
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
