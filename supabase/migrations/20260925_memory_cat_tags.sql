-- Fix: the memory table (the XP ledger that Pillar totals are summed from)
-- was missing the cat and tags columns that every write path in
-- AppDataContext.jsx has always tried to insert (completeItem, toggleDay,
-- awardValuePillarXP). Every completion has therefore been failing to
-- persist silently (insert 400s, caught nowhere, so nothing surfaced) —
-- Pillar XP has never actually been recording. Purely additive.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

alter table public.memory
  add column if not exists cat text,
  add column if not exists tags text[];
