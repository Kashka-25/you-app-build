-- Link the four oldest tables to accounts, so deleting an account deletes
-- everything (Nov 4 2026).
--
-- items (habits, goals, dreams, ideas), memory (XP events), mood_log and
-- user_xp were made by the first app, with user_id as plain text and no
-- link to auth.users. Every other table cascades on account delete; these
-- four didn't, so "Delete my account" left them behind. They're also the
-- ledger a future Realm/RPG will read, so they need to belong to a real
-- account.
--
-- Before running: take a backup (node supabase/backup/backup.mjs). That
-- backup also holds the rows step 1 removes.
--
-- Step 1 removes rows no one can ever reach: ids from the first app
-- (user_…: 24 items, 17 memory, 1 user_xp on Nov 4) and rows of deleted
-- accounts (6 items). Row-level security already hid them from everyone.
-- Approved by Cassidy, Nov 4. Rehearsed on live inside a rolled-back
-- transaction on Nov 4: items 72 → 42, memory 89 → 72, 4 cascades, 9 policies.
--
-- Same ids, new type: values are copied as they are, so the app, the
-- offline queue on phones (which sends user_id as the same string) and the
-- Edge Functions keep working unchanged.

begin;

-- 1 · rows that belong to no account
delete from public.items t
  where t.user_id !~ '^[0-9a-fA-F-]{36}$'
     or not exists (select 1 from auth.users u where u.id::text = t.user_id);
delete from public.memory t
  where t.user_id !~ '^[0-9a-fA-F-]{36}$'
     or not exists (select 1 from auth.users u where u.id::text = t.user_id);
delete from public.mood_log t
  where t.user_id !~ '^[0-9a-fA-F-]{36}$'
     or not exists (select 1 from auth.users u where u.id::text = t.user_id);
delete from public.user_xp t
  where t.user_id !~ '^[0-9a-fA-F-]{36}$'
     or not exists (select 1 from auth.users u where u.id::text = t.user_id);

-- 2 · policies compare text today; drop them while the type changes
drop policy if exists "own rows" on public.items;
drop policy if exists "own rows" on public.memory;
drop policy if exists "own rows" on public.mood_log;
drop policy if exists "own rows" on public.user_xp;
-- …and three on other tables that look up the owner of an item
drop policy if exists habit_logs_own on public.habit_logs;
drop policy if exists wanderings_insert_own on public.wanderings;
drop policy if exists wanderings_update_own on public.wanderings;

-- 3 · text → uuid, linked to the account, removed with it
alter table public.items    alter column user_id type uuid using user_id::uuid;
alter table public.memory   alter column user_id type uuid using user_id::uuid;
alter table public.mood_log alter column user_id type uuid using user_id::uuid;
alter table public.user_xp  alter column user_id type uuid using user_id::uuid;

alter table public.items    add constraint items_user_id_fkey    foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.memory   add constraint memory_user_id_fkey   foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.mood_log add constraint mood_log_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.user_xp  add constraint user_xp_user_id_fkey  foreign key (user_id) references auth.users(id) on delete cascade;

-- 4 · the same "own rows" rule, now uuid to uuid (auth.uid() read once per
-- query, as the performance advisor recommends)
create policy "own rows" on public.items    for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.memory   for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.mood_log for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.user_xp  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- The same three as before, comparing uuid to uuid.
create policy habit_logs_own on public.habit_logs for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (
    select 1 from public.items i where i.id = habit_logs.item_id and i.user_id = auth.uid()));
create policy wanderings_insert_own on public.wanderings for insert to public
  with check (auth.uid() = user_id and (item_id is null or exists (
    select 1 from public.items i where i.id = wanderings.item_id and i.user_id = auth.uid())));
create policy wanderings_update_own on public.wanderings for update to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and (item_id is null or exists (
    select 1 from public.items i where i.id = wanderings.item_id and i.user_id = auth.uid())));

-- 5 · every screen filters these by user_id
create index if not exists items_user_id_idx    on public.items (user_id);
create index if not exists memory_user_id_idx   on public.memory (user_id);
create index if not exists mood_log_user_id_idx on public.mood_log (user_id);

commit;

-- Check afterwards (expect 4 rows, each 'c'):
-- select conrelid::regclass, confdeltype from pg_constraint
--  where confrelid = 'auth.users'::regclass
--    and conrelid::regclass::text in ('items','memory','mood_log','user_xp');
