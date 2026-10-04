-- Mementos on focus sessions: every completed hour of focus (counted across
-- all sessions) grows one memento, a short public-domain line from the
-- greats, on the flower that crossed that hour. Stored as
-- [{"id": <MEMENTOS id in constants/mementos.js>, "hour": <n-th hour>}].
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje.

alter table public.focus_sessions
  add column if not exists mementos jsonb not null default '[]'::jsonb;
