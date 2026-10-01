-- Memories pinned to places. A life moment ("Add a memory") or a journal
-- entry can be pinned to one Wandering stop — the first step toward Life
-- Constellations (memories as stars over the places they happened).
--
-- on delete set null: removing a stop (or its whole Wandering) never
-- deletes a memory; the memory just stops being pinned there.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

alter table public.life_moments
  add column if not exists stop_id uuid references public.wandering_stops(id) on delete set null;

alter table public.journal_entries
  add column if not exists stop_id uuid references public.wandering_stops(id) on delete set null;

create index if not exists life_moments_stop_idx on public.life_moments (stop_id) where stop_id is not null;
create index if not exists journal_entries_stop_idx on public.journal_entries (stop_id) where stop_id is not null;
