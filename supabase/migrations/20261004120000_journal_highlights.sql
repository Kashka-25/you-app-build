-- Journal highlights — the words worth keeping from an entry, in the
-- Seeker's own words. Kept by hand (select text in an entry) or picked from
-- the "moments worth keeping" a journal reflection suggests. A highlight can
-- carry tags, be linked to a dream (so dream ideas gather in one place), and
-- come back as a personal memento after a focus hour.
--
-- entry_id: set null if the entry is deleted, so a kept highlight isn't lost
--   with it; entry_date keeps its date either way.
-- item_id: the dream (or any pursuit) it feeds, optional.
-- as_memento: may it return as a personal memento? On by default.
--
-- Also: journal_ai_insights.highlights, the exact sentences a reflection
-- suggests keeping (checked server-side to really be in the entry).
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje.

create table if not exists public.journal_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references public.journal_entries(id) on delete set null,
  entry_date date,
  text text not null check (char_length(text) between 1 and 600),
  tags text[] not null default '{}',
  item_id uuid references public.items(id) on delete set null,
  as_memento boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists journal_highlights_user_idx on public.journal_highlights (user_id, created_at desc);

alter table public.journal_highlights enable row level security;

drop policy if exists "journal_highlights_select_own" on public.journal_highlights;
create policy "journal_highlights_select_own" on public.journal_highlights for select using (auth.uid() = user_id);
drop policy if exists "journal_highlights_insert_own" on public.journal_highlights;
create policy "journal_highlights_insert_own" on public.journal_highlights for insert with check (auth.uid() = user_id);
drop policy if exists "journal_highlights_update_own" on public.journal_highlights;
create policy "journal_highlights_update_own" on public.journal_highlights for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "journal_highlights_delete_own" on public.journal_highlights;
create policy "journal_highlights_delete_own" on public.journal_highlights for delete using (auth.uid() = user_id);

alter table public.journal_ai_insights
  add column if not exists highlights jsonb not null default '[]'::jsonb;
