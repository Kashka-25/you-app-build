-- Course Arcana: rest is suggested, never enforced (Oct 5).
--
-- After each part a course suggests a rest before the next opens. A Seeker
-- may choose to continue anyway; rest_skipped_at on the part they just
-- finished records that choice, so the next part opens on every device.
--
-- Additive; safe to re-run.
-- Run in the Supabase SQL editor for project yikoymzktspamahrsuje.

alter table public.arcanum_progress add column if not exists rest_skipped_at timestamptz;

notify pgrst, 'reload schema';
