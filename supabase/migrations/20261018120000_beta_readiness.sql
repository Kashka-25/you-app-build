-- Beta readiness (Oct 18): feedback from testers, and crash reports.
--
-- beta_feedback: what a tester sends with "Send feedback". Written by the
--   send-feedback Edge Function as the tester (RLS: their own rows only),
--   then forwarded to the Build Notes inbox in Notion. Kept here too, so
--   nothing is lost if Notion is unreachable.
-- client_errors: a short technical note when a screen crashes (message,
--   stack, path; never what the Seeker wrote). Testers can add their own;
--   only admins can read them.

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  kind text not null default 'idea' check (kind in ('idea', 'problem', 'love')),
  screen text check (char_length(screen) <= 200),
  notion_url text,
  created_at timestamptz not null default now()
);
create index if not exists beta_feedback_user_created on public.beta_feedback (user_id, created_at desc);
alter table public.beta_feedback enable row level security;

drop policy if exists "beta_feedback_insert_own" on public.beta_feedback;
create policy "beta_feedback_insert_own" on public.beta_feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "beta_feedback_select_own_or_admin" on public.beta_feedback;
create policy "beta_feedback_select_own_or_admin" on public.beta_feedback
  for select to authenticated using ((select auth.uid()) = user_id or (select public.showcase_is_admin()));
drop policy if exists "beta_feedback_update_own" on public.beta_feedback;
create policy "beta_feedback_update_own" on public.beta_feedback
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  message text not null check (char_length(message) <= 500),
  stack text check (char_length(stack) <= 4000),
  path text check (char_length(path) <= 200),
  user_agent text check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists client_errors_created on public.client_errors (created_at desc);
alter table public.client_errors enable row level security;

drop policy if exists "client_errors_insert_own" on public.client_errors;
create policy "client_errors_insert_own" on public.client_errors
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "client_errors_select_admin" on public.client_errors;
create policy "client_errors_select_admin" on public.client_errors
  for select to authenticated using ((select public.showcase_is_admin()));

-- A runaway crash loop can't fill the table: at most 20 reports per person
-- per hour; extra ones are quietly dropped.
create or replace function public.client_errors_throttle()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.client_errors
      where user_id = new.user_id and created_at > now() - interval '1 hour') >= 20 then
    return null;
  end if;
  return new;
end;
$$;
revoke all on function public.client_errors_throttle() from public, anon, authenticated;
drop trigger if exists client_errors_throttle on public.client_errors;
create trigger client_errors_throttle before insert on public.client_errors
  for each row execute function public.client_errors_throttle();
