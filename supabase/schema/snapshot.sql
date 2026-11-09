-- Reads the live schema of YOU's own schemas (public plus private ones such
-- as you_private and yourigin_private): tables, sequences, functions and
-- who may call them, triggers, RLS policies and storage buckets, and returns
-- it as DDL text, one statement per row. Read-only: it only selects from
-- the system catalogue.
--
-- Run:  node supabase/schema/snapshot.mjs   (writes supabase/schema/baseline.sql)
-- Why: the oldest tables (profiles, items, memory, mood_log, user_values,
-- value_challenges, life_moments, life_chapters) were made by the first
-- app and have no migration, and the remote migration history is out of
-- sync. This keeps a record of what the database really is, and it is the
-- schema half of every backup (supabase/backup), so a restore needs it to be
-- complete. The 9 Nov 2026 test restore showed it was missing the private
-- schemas, sequences and function permissions; those are included now.
with
-- Schemas that belong to YOU, not to Postgres or Supabase.
app as (
  select n.oid, n.nspname
  from pg_namespace n
  where n.nspname = 'public'
     or (n.nspname not like 'pg\_%'
         and n.nspname not in ('information_schema', 'auth', 'storage', 'extensions', 'graphql', 'graphql_public',
           'realtime', '_realtime', 'supabase_functions', 'supabase_migrations', 'vault', 'pgbouncer', 'net', 'cron',
           'pgsodium', 'pgsodium_masks', '_analytics', 'pgmq', 'pgmq_public')
         and not exists (select 1 from pg_depend d where d.objid = n.oid and d.deptype = 'e'))
),
tbl as (
  select c.oid, a.nspname, c.relname, c.relrowsecurity
  from pg_class c join app a on a.oid = c.relnamespace
  where c.relkind in ('r','p')
),
cols as (
  select t.oid, a.attnum,
    format('  %I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
      case when a.attnotnull then ' not null' else '' end,
      case when d.adbin is not null then ' default ' || pg_get_expr(d.adbin, d.adrelid) else '' end) as line
  from tbl t join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = t.oid and d.adnum = a.attnum
),
fns as (
  select p.oid, a.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p join app a on a.oid = p.pronamespace
  where p.prokind in ('f','p')
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
),
stmts as (
  -- 0 · private schemas
  select -1 as grp, a.nspname::text as k, 0 as sub, format('create schema if not exists %I;', a.nspname) as ddl
  from app a where a.nspname <> 'public'
  union all
  -- 0 · sequences (before the tables whose defaults use them)
  select 0, s.schemaname || '.' || s.sequencename, 1,
    format('create sequence if not exists %I.%I as %s increment %s minvalue %s maxvalue %s start %s%s;',
      s.schemaname, s.sequencename, s.data_type, s.increment_by, s.min_value, s.max_value, s.start_value,
      case when s.cycle then ' cycle' else '' end)
  from pg_sequences s where s.schemaname in (select nspname from app)
  union all
  -- 1 · tables
  select 1, t.nspname || '.' || t.relname, 0,
    format(E'create table if not exists %I.%I (\n%s\n);', t.nspname, t.relname,
      (select string_agg(line, E',\n' order by attnum) from cols where cols.oid = t.oid))
  from tbl t
  union all
  -- 2 · constraints (primary keys and checks first, foreign keys after)
  select 2, t.nspname || '.' || t.relname || con.conname, case con.contype when 'p' then 0 when 'u' then 1 when 'c' then 2 else 3 end,
    format('alter table %I.%I add constraint %I %s;', t.nspname, t.relname, con.conname, pg_get_constraintdef(con.oid))
  from tbl t join pg_constraint con on con.conrelid = t.oid
  union all
  -- 2 · sequences owned by a column, and where each sequence has got to
  select 2, s.schemaname || '.' || s.sequencename, 9,
    concat_ws(E'\n',
      (select format('alter sequence %I.%I owned by %I.%I.%I;', s.schemaname, s.sequencename, tn.nspname, tc.relname, ta.attname)
         from pg_class sc join pg_namespace sn on sn.oid = sc.relnamespace
         join pg_depend d on d.objid = sc.oid and d.deptype in ('a','i') and d.refobjsubid > 0
         join pg_class tc on tc.oid = d.refobjid join pg_namespace tn on tn.oid = tc.relnamespace
         join pg_attribute ta on ta.attrelid = tc.oid and ta.attnum = d.refobjsubid
         where sn.nspname = s.schemaname and sc.relname = s.sequencename),
      case when s.last_value is not null
        then format('select setval(%L, %s, true);', quote_ident(s.schemaname) || '.' || quote_ident(s.sequencename), s.last_value) end)
  from pg_sequences s where s.schemaname in (select nspname from app)
  union all
  -- 3 · indexes that aren't backing a constraint
  select 3, t.nspname || '.' || i.relname, 0, pg_get_indexdef(i.oid) || ';'
  from tbl t join pg_index x on x.indrelid = t.oid join pg_class i on i.oid = x.indexrelid
  where not exists (select 1 from pg_constraint c where c.conindid = i.oid)
  union all
  -- 4 · functions
  select 4, f.nspname || '.' || f.proname || '(' || f.args || ')', 0, pg_get_functiondef(f.oid) || ';'
  from fns f
  union all
  -- 4 · who may call each function. New functions are callable by everyone
  -- by default, so this states it exactly: several are locked to signed-in
  -- users or to the server only, and a restore must keep them that way.
  select 4, f.nspname || '.' || f.proname || '(' || f.args || ')', 1,
    concat_ws(E'\n',
      format('revoke all on function %I.%I(%s) from public, anon, authenticated;', f.nspname, f.proname, f.args),
      (select string_agg(format('grant execute on function %I.%I(%s) to %I;', f.nspname, f.proname, f.args, r), E'\n' order by r)
         from unnest(array['anon', 'authenticated', 'service_role']) r
         where has_function_privilege(r, f.oid, 'execute')))
  from fns f
  union all
  -- 4 · who may use each private schema
  select 4, a.nspname, 2,
    (select string_agg(format('grant usage on schema %I to %I;', a.nspname, r), E'\n' order by r)
       from unnest(array['anon', 'authenticated', 'service_role']) r
       where has_schema_privilege(r, a.oid, 'usage'))
  from app a where a.nspname <> 'public'
  union all
  -- 5 · triggers on YOU's tables and on auth.users (handle_new_user)
  select 5, tg.tgname, 0, pg_get_triggerdef(tg.oid) || ';'
  from pg_trigger tg join pg_class c on c.oid = tg.tgrelid join pg_namespace n on n.oid = c.relnamespace
  where not tg.tgisinternal and (n.oid in (select oid from app) or (n.nspname = 'auth' and c.relname = 'users'))
  union all
  -- 6 · row level security
  select 6, t.nspname || '.' || t.relname, 0, format('alter table %I.%I enable row level security;', t.nspname, t.relname)
  from tbl t where t.relrowsecurity
  union all
  -- 7 · policies on YOU's tables and on storage
  select 7, pol.schemaname || pol.tablename || pol.policyname, 0,
    format('create policy %I on %I.%I as %s for %s to %s%s%s;',
      pol.policyname, pol.schemaname, pol.tablename, pol.permissive, pol.cmd,
      array_to_string(pol.roles, ', '),
      case when pol.qual is not null then E'\n  using (' || pol.qual || ')' else '' end,
      case when pol.with_check is not null then E'\n  with check (' || pol.with_check || ')' else '' end)
  from pg_policies pol where pol.schemaname in (select nspname from app) or pol.schemaname = 'storage'
  union all
  -- 8 · storage buckets
  select 8, b.id, 0,
    format('insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (%L, %L, %s, %s, %L) on conflict (id) do nothing;',
      b.id, b.name, case when b.public then 'true' else 'false' end, coalesce(b.file_size_limit::text, 'null'), b.allowed_mime_types)
  from storage.buckets b
)
-- Within each group, the kind (sub) comes before the name, so every primary
-- key exists before any foreign key that points at it.
select ddl from stmts where ddl is not null order by grp, sub, k;
