-- Profile identity (My YOU) — adds bio/location, guarantees every auth user
-- has a profiles row, and makes sure RLS lets a user read/write their own
-- row. Written defensively (IF NOT EXISTS / DROP+CREATE) so it's safe to
-- run against the existing production project without knowing its exact
-- current state ahead of time.
--
-- Run this in the Supabase SQL editor for project yikoymzktspamahrsuje
-- (Dashboard → SQL Editor → New query → paste → Run).

-- 1. New identity columns. Existing columns (name, birthday, birth_time,
--    birthplace, sun_sign, moon_sign, rising_sign) are untouched.
alter table public.profiles
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists updated_at timestamptz not null default now();

-- 1b. Make sure user_id is unique so "one profile per user" is enforced by
--     the database (needed for the ON CONFLICT in the trigger below) —
--     added defensively since we can't inspect the live schema ahead of
--     time; skipped if a unique/PK constraint on user_id already exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles'
      and c.contype in ('p', 'u')
      and c.conkey = (
        select array_agg(a.attnum order by a.attnum)
        from pg_attribute a
        where a.attrelid = t.oid and a.attname = 'user_id'
      )
  ) then
    alter table public.profiles add constraint profiles_user_id_key unique (user_id);
  end if;
end $$;

-- 2. RLS: a user can only ever see/change their own profile row.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Auto-create a blank profiles row the moment someone signs up, so the
--    My YOU screen always has something to edit — no separate onboarding
--    step required (web-next's SignIn has none, unlike the vanilla app).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Backfill: give any existing auth user who somehow has no profiles row
--    (e.g. signed up through web-next before this migration) one now.
insert into public.profiles (user_id)
select u.id from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;
