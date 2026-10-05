-- Smaller steps for quick-list to-dos — the same [{ text, done }] shape as
-- items.milestones, so a to-do can be broken down like any pursuit.
-- Still no Pillar, no XP: it only makes a big-feeling thing doable.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

alter table public.todos
  add column if not exists steps jsonb not null default '[]'::jsonb;
