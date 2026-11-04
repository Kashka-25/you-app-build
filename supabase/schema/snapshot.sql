-- Reads the live schema of YOU's public tables, functions, triggers, RLS
-- policies and storage buckets, and returns it as DDL text, one statement
-- per row. Read-only: it only selects from the system catalogue.
--
-- Run:  node supabase/schema/snapshot.mjs   (writes supabase/schema/baseline.sql)
-- Why: the oldest tables (profiles, items, memory, mood_log, user_values,
-- value_challenges, life_moments, life_chapters) were made by the first
-- app and have no migration, and the remote migration history is out of
-- sync. This keeps a record of what the database really is.
with
tbl as (
  select c.oid, c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','p')
),
cols as (
  select t.relname, a.attnum,
    format('  %I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
      case when a.attnotnull then ' not null' else '' end,
      case when d.adbin is not null then ' default ' || pg_get_expr(d.adbin, d.adrelid) else '' end) as line
  from tbl t join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = t.oid and d.adnum = a.attnum
),
stmts as (
  -- 1 · tables
  select 1 as grp, t.relname as k, 0 as sub,
    format(E'create table if not exists public.%I (\n%s\n);', t.relname,
      (select string_agg(line, E',\n' order by attnum) from cols where cols.relname = t.relname)) as ddl
  from tbl t
  union all
  -- 2 · constraints (primary keys and checks first, foreign keys after)
  select 2, t.relname || con.conname, case con.contype when 'p' then 0 when 'u' then 1 when 'c' then 2 else 3 end,
    format('alter table public.%I add constraint %I %s;', t.relname, con.conname, pg_get_constraintdef(con.oid))
  from tbl t join pg_constraint con on con.conrelid = t.oid
  union all
  -- 3 · indexes that aren't backing a constraint
  select 3, i.relname::text, 0, pg_get_indexdef(i.oid) || ';'
  from tbl t join pg_index x on x.indrelid = t.oid join pg_class i on i.oid = x.indexrelid
  where not exists (select 1 from pg_constraint c where c.conindid = i.oid)
  union all
  -- 4 · functions in public
  select 4, p.proname, 0, pg_get_functiondef(p.oid) || ';'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind in ('f','p')
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  union all
  -- 5 · triggers on public tables and on auth.users (handle_new_user)
  select 5, tg.tgname, 0, pg_get_triggerdef(tg.oid) || ';'
  from pg_trigger tg join pg_class c on c.oid = tg.tgrelid join pg_namespace n on n.oid = c.relnamespace
  where not tg.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))
  union all
  -- 6 · row level security
  select 6, t.relname, 0, format('alter table public.%I enable row level security;', t.relname)
  from tbl t where t.relrowsecurity
  union all
  -- 7 · policies on public and storage tables
  select 7, pol.schemaname || pol.tablename || pol.policyname, 0,
    format('create policy %I on %I.%I as %s for %s to %s%s%s;',
      pol.policyname, pol.schemaname, pol.tablename, pol.permissive, pol.cmd,
      array_to_string(pol.roles, ', '),
      case when pol.qual is not null then E'\n  using (' || pol.qual || ')' else '' end,
      case when pol.with_check is not null then E'\n  with check (' || pol.with_check || ')' else '' end)
  from pg_policies pol where pol.schemaname in ('public','storage')
  union all
  -- 8 · storage buckets
  select 8, b.id, 0,
    format('insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (%L, %L, %s, %s, %L) on conflict (id) do nothing;',
      b.id, b.name, case when b.public then 'true' else 'false' end, coalesce(b.file_size_limit::text, 'null'), b.allowed_mime_types)
  from storage.buckets b
)
select ddl from stmts order by grp, k, sub;
