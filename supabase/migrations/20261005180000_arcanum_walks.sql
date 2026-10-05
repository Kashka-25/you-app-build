-- Course Arcana: walk a course as many times as you like (Oct 5).
--
-- Each time through is a "walk". Answers stay with the walk they were
-- written in, so a Seeker can look back at every walk, with its dates.
--
--   1. arcanum_progress.walk     — which walk a finished part belongs to
--                                  (existing rows are walk 1). The key
--                                  becomes (user, slug, walk, part).
--      arcanum_progress.summary  — the answers in readable form
--                                  ([{label, lines}]), so they can be read
--                                  back (and, with consent, by AI reviews)
--                                  without the course's own content.
--   2. arcanum_walks             — one row per walk: started, completed.
--   3. ai_consent.include_courses — a separate, explicit yes before course
--                                  answers are included in AI reviews (the
--                                  weekly reflection). Off unless chosen.
--
-- Additive; safe to re-run.
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

-- ── 1. walks on progress ─────────────────────────────────────────────────
alter table public.arcanum_progress add column if not exists walk integer not null default 1;
alter table public.arcanum_progress add column if not exists summary jsonb;

do $$
begin
  if exists (
    select 1 from information_schema.key_column_usage
    where table_schema = 'public' and table_name = 'arcanum_progress'
      and constraint_name = 'arcanum_progress_pkey' and column_name = 'walk'
  ) then
    return;
  end if;
  alter table public.arcanum_progress drop constraint if exists arcanum_progress_pkey;
  alter table public.arcanum_progress add primary key (user_id, slug, walk, part_id);
end $$;

-- ── 2. arcanum_walks ─────────────────────────────────────────────────────
create table if not exists public.arcanum_walks (
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null references public.arcana(slug) on delete cascade,
  walk integer not null check (walk >= 1),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, slug, walk)
);
alter table public.arcanum_walks enable row level security;

drop policy if exists "arcanum_walks_select_own" on public.arcanum_walks;
create policy "arcanum_walks_select_own" on public.arcanum_walks
  for select using (auth.uid() = user_id);
drop policy if exists "arcanum_walks_insert_held" on public.arcanum_walks;
create policy "arcanum_walks_insert_held" on public.arcanum_walks
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.user_arcana ua where ua.user_id = auth.uid() and ua.slug = arcanum_walks.slug)
  );
drop policy if exists "arcanum_walks_update_own" on public.arcanum_walks;
create policy "arcanum_walks_update_own" on public.arcanum_walks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Walk 1 for anyone already on a course.
insert into public.arcanum_walks (user_id, slug, walk, started_at)
select user_id, slug, 1, min(completed_at) from public.arcanum_progress group by user_id, slug
on conflict do nothing;

-- ── 3. consent to include courses in AI reviews ──────────────────────────
alter table public.ai_consent add column if not exists include_courses boolean not null default false;
alter table public.ai_consent add column if not exists courses_asked_at timestamptz;

notify pgrst, 'reload schema';
