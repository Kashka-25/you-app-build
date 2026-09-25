-- Values currently hard-cap at 99 and just stop. Adding a prestige counter
-- so a value can instead cycle — same "hit the cap, reset, next cycle
-- requires more" mechanic Pillars already have (see getPrestigeLevel in
-- app.const.js) and habits already have (getPrestigeTier). Purely additive.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

alter table public.user_values
  add column if not exists prestige integer not null default 0;
