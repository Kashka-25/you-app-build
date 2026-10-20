-- Security Advisor tidy-up (Oct 20). Three Showcase functions only ever run
-- as triggers, but were also callable through the API (/rest/v1/rpc), by
-- signed-out visitors too. Revoking EXECUTE closes that; triggers keep
-- firing (Postgres checks EXECUTE when a trigger is created, not each time
-- it fires; verified the same way for handle_new_user on Oct 2).
-- artist_profiles_touch also gets a fixed search_path.
--
-- Left as they are, on purpose: showcase_is_admin() (used inside RLS
-- policies), showcase_save_counts() (the app's own call) and
-- review_showcase_work() (checks showcase_is_admin() first).
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje.

revoke execute on function public.showcase_works_guard() from public, anon, authenticated;
revoke execute on function public.showcase_credits_link() from public, anon, authenticated;
revoke execute on function public.artist_profiles_touch() from public, anon, authenticated;

alter function public.artist_profiles_touch() set search_path = public;
