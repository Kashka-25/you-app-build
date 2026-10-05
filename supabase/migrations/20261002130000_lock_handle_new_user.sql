-- handle_new_user() is a SECURITY DEFINER trigger function: it only ever
-- runs from the on_auth_user_created trigger on auth.users, to create an
-- empty profile row for each new Seeker. It was also callable directly by
-- anyone through the API (/rest/v1/rpc/handle_new_user), which Supabase's
-- security advisor flags.
--
-- Revoking EXECUTE from the public-facing roles closes that. The trigger is
-- unaffected: Postgres checks EXECUTE on a trigger function when the trigger
-- is created, not each time it fires.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

revoke execute on function public.handle_new_user() from public, anon, authenticated;
