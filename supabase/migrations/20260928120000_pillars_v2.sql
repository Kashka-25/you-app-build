-- Pillars v2 (adopted Sep 28): 7 Pillars -> 8 (4 inner, 4 outer).
--   Inner: Body, Heart, Mind, Spirit
--   Outer: Connection, Purpose, Play, Home & Earth
-- Renames: Relationships -> Connection, Work -> Purpose,
--          Adventure / Creative / Recreation -> Play.
-- NOT REVERSIBLE for Adventure/Creative (both merge into Play).
-- Pillar XP is derived from memory.cat, so nothing else to recompute.
-- Safe to run more than once.
--
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

update public.items set cat = case cat
  when 'Relationships' then 'Connection' when 'Work' then 'Purpose' else 'Play' end
where cat in ('Relationships','Work','Adventure','Creative','Recreation');

update public.memory set cat = case cat
  when 'Relationships' then 'Connection' when 'Work' then 'Purpose' else 'Play' end
where cat in ('Relationships','Work','Adventure','Creative','Recreation');

-- identity_visions.category is free text; only exact old Pillar names change.
update public.identity_visions set category = case category
  when 'Relationships' then 'Connection' when 'Work' then 'Purpose' else 'Play' end
where category in ('Relationships','Work','Adventure','Creative','Recreation');
