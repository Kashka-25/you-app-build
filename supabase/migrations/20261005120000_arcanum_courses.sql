-- YOUniversity · course Arcana (Oct 5).
--
-- The first paid Arcanum, The Sovereign Empath, is a course: stages of a
-- lesson, a practice and a challenge, paced with rest between them. Its
-- words live in the app (constants/arcana/); this records what each Seeker
-- has done and every time they use a tool it gave them.
--
--   1. arcana            — adds the-sovereign-empath (paid; "coming soon"
--                          until payments exist, granted as a gift to test).
--   2. arcanum_progress  — one row per finished part (check-in, lesson,
--                          practice, challenge), with its answers. completed_on
--                          is the Seeker's local date, which paces the next
--                          part.
--   3. tool_uses         — each use of a tool an Arcanum gave (the Boundary
--                          Builder, the 90-Second Centre…), with its answers.
--
-- Both are owner-only, and can only be written for an Arcanum the Seeker
-- holds (user_arcana). Additive; safe to re-run.
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

insert into public.arcana (slug, is_free) values ('the-sovereign-empath', false)
on conflict (slug) do nothing;

-- ── arcanum_progress ─────────────────────────────────────────────────────
create table if not exists public.arcanum_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null references public.arcana(slug) on delete cascade,
  part_id text not null check (char_length(part_id) between 1 and 80),
  data jsonb not null default '{}',
  value_name text,
  completed_on date not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, slug, part_id)
);

alter table public.arcanum_progress enable row level security;

drop policy if exists "arcanum_progress_select_own" on public.arcanum_progress;
create policy "arcanum_progress_select_own" on public.arcanum_progress
  for select using (auth.uid() = user_id);

drop policy if exists "arcanum_progress_insert_held" on public.arcanum_progress;
create policy "arcanum_progress_insert_held" on public.arcanum_progress
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.user_arcana ua where ua.user_id = auth.uid() and ua.slug = arcanum_progress.slug)
  );

drop policy if exists "arcanum_progress_update_held" on public.arcanum_progress;
create policy "arcanum_progress_update_held" on public.arcanum_progress
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.user_arcana ua where ua.user_id = auth.uid() and ua.slug = arcanum_progress.slug)
  );

drop policy if exists "arcanum_progress_delete_own" on public.arcanum_progress;
create policy "arcanum_progress_delete_own" on public.arcanum_progress
  for delete using (auth.uid() = user_id);

-- ── tool_uses ────────────────────────────────────────────────────────────
create table if not exists public.tool_uses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null references public.arcana(slug) on delete cascade,
  tool_id text not null check (char_length(tool_id) between 1 and 80),
  data jsonb not null default '{}',
  used_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists tool_uses_user_idx on public.tool_uses (user_id, slug, tool_id, created_at desc);

alter table public.tool_uses enable row level security;

drop policy if exists "tool_uses_select_own" on public.tool_uses;
create policy "tool_uses_select_own" on public.tool_uses
  for select using (auth.uid() = user_id);

drop policy if exists "tool_uses_insert_held" on public.tool_uses;
create policy "tool_uses_insert_held" on public.tool_uses
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.user_arcana ua where ua.user_id = auth.uid() and ua.slug = tool_uses.slug)
  );

drop policy if exists "tool_uses_delete_own" on public.tool_uses;
create policy "tool_uses_delete_own" on public.tool_uses
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
