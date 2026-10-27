-- YOUr Projects (Oct 25): an optional package each YOUser can switch on in
-- Your Own Universe. Projects of their own (a book, a garden, a move) with
-- a running list of notes and to-dos, each New, Doing or Done, like
-- Cassidy's Build Notes. YOUrnal entries tagged with a project's name are
-- filed into it (entry_id links back to the entry).
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  colour text not null default 'gold',
  position integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 4000),
  status text not null default 'new' check (status in ('new', 'doing', 'done')),
  entry_id uuid references public.journal_entries(id) on delete set null,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id, position);
create index if not exists project_notes_project_idx on public.project_notes (project_id, created_at desc);
create index if not exists project_notes_user_idx on public.project_notes (user_id);
-- One note per YOUrnal entry per project, so saving the entry again updates
-- it (notes typed in directly have no entry, and empty links never clash).
create unique index if not exists project_notes_entry_uniq on public.project_notes (project_id, entry_id);

alter table public.projects enable row level security;
alter table public.project_notes enable row level security;

drop policy if exists "projects_own" on public.projects;
create policy "projects_own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A note can only go into one of your own projects.
drop policy if exists "project_notes_own" on public.project_notes;
create policy "project_notes_own" on public.project_notes
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
