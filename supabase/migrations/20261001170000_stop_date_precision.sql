-- How precisely a Wandering stop's dates are known. Remembered trips often
-- only have a year ("2019") or a month ("November 2023"). The date columns
-- hold the start of that period (and, for a span, its end), and the app
-- always *displays* only what's known: never an invented exact day.
--
-- day   — exact dates (default; everything planned in the app)
-- month — "November 2023", or a span like "Jul – Oct 2026"
-- year  — "2019"
--
-- Approximate stops still count toward "Everywhere you've been" and
-- Constellations, but don't get per-day plans or automatic memory pinning
-- (those need real days).
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

alter table public.wandering_stops
  add column if not exists date_precision text not null default 'day'
  check (date_precision in ('day', 'month', 'year'));
