-- ai_usage is now what the beta AI budget is counted from (the per-Seeker
-- monthly allowance and the whole-app monthly budget in
-- functions/_shared/limit.ts). Rows are written only by the Edge
-- Functions, with the service role, which bypasses RLS.
--
-- The old "own usage insert" policy let any signed-in user insert rows
-- for themselves. With the shared budget, one forged row with huge token
-- counts could pause AI for every tester. Dropping it closes that; Seekers
-- can still read their own usage (to see their allowance).
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

drop policy if exists "own usage insert" on public.ai_usage;
