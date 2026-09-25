-- Sub-categorization for pursuits, one level deeper than the fixed Pillar
-- (cat). Free text rather than a fixed enum, same reasoning as
-- identity_visions.category: the user assigns their own structure (e.g.
-- "Music/Songs") instead of the app dictating a taxonomy. A "/" in the
-- value is how the UI nests it (Music > Songs); a plain value with no "/"
-- is a single sub-category with no further nesting.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

alter table public.items
  add column if not exists subcat text not null default '';
