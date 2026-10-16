// Run: npm i --prefix /tmp/pg @electric-sql/pglite@0.2.17 && NODE_PATH=/tmp/pg/node_modules node supabase/tests/showcase_rls.mjs supabase/migrations/20261005160000_value_words.sql supabase/migrations/20261016120000_showcase.sql
// Dry-runs the Showcase migration on PGlite with Supabase-like auth/storage stubs,
// then checks the RLS rules as an artist, a viewer and an admin.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const [valueWords, showcase] = process.argv.slice(2).map((p) => readFileSync(p, 'utf8'));
const db = new PGlite();

const A = '00000000-0000-0000-0000-00000000000a';
const V = '00000000-0000-0000-0000-00000000000b';
const ADMIN = '00000000-0000-0000-0000-0000000000ad';

await db.exec(`
create role anon nologin; create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
insert into auth.users values ('${A}', 'artist@x.test'), ('${V}', 'viewer@x.test'), ('${ADMIN}', 'kasiahrd@proton.me');
`);
// Only the admins part of the older migration is needed.
const adminsPart = valueWords.slice(valueWords.indexOf('-- ── 1. admins'), valueWords.indexOf('-- ── 2. value_words'));
await db.exec(adminsPart);
await db.exec(showcase);
await db.exec(showcase); // safe to re-run
await db.exec(`
grant usage on schema public, auth, storage to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant execute on function auth.uid() to authenticated;
`);

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
};
async function as(uid, sql, params) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  return db.query(sql, params);
}
async function fails(uid, sql) {
  try {
    await as(uid, sql);
    return false;
  } catch {
    return true;
  }
}

ok((await db.query(`select count(*)::int n from public.admins`)).rows[0].n === 1, 'admin seeded from email');

// Artist profile + piece
await as(A, `insert into artist_profiles (display_name, links, kronk_handle) values ('Ana', '[{"kind":"kofi","url":"https://ko-fi.com/ana"}]', '@ana@kronk.social')`);
await as(V, `insert into artist_profiles (display_name, kronk_handle) values ('Ben', '@ben@kronk.social')`);
const w = (
  await as(A, `insert into showcase_works (source_id, kind, title, image_path, placements, save_mode, rights_confirmed_at, status)
               values ('c1', 'image', 'Heron', '${A}/c1-1.webp', '{home_background,gallery}', 'contribution', now(), 'live') returning id, status`)
).rows[0];
ok(w.status === 'waiting', 'a new share always starts waiting, even if it asks to be live');
ok((await as(V, `select id from showcase_works`)).rows.length === 0, 'viewer cannot see a waiting piece');
ok((await as(V, `select user_id from artist_profiles where user_id = '${A}'`)).rows.length === 0, "viewer cannot see an artist's profile before anything is live");
await as(A, `update showcase_works set status = 'live' where id = '${w.id}'`);
ok((await as(A, `select status from showcase_works where id = '${w.id}'`)).rows[0].status === 'waiting', 'artist cannot approve their own piece');
ok(await fails(A, `insert into showcase_works (kind, body, placements, rights_confirmed_at) values ('words', 'x', '{home_background}', now())`), 'written work cannot be a home background');
ok(await fails(A, `insert into showcase_works (kind, body, placements) values ('words', 'x', '{gallery}')`), 'a share needs the rights tick');

// Credits while waiting, linked by Kronk handle
await as(A, `insert into showcase_credits (work_id, name, kronk_handle, artist_user_id) values ('${w.id}', 'Ben', '@BEN@kronk.social', '${ADMIN}')`);
ok((await db.query(`select artist_user_id from showcase_credits`)).rows[0].artist_user_id === V, 'credit links to the artist with that Kronk handle (not whoever the client says)');
ok(await fails(V, `insert into showcase_credits (work_id, name) values ('${w.id}', 'Mallory')`), "someone else cannot add credits to a piece");

// Storage before live
await as(A, `insert into storage.objects (bucket_id, name) values ('showcase', '${A}/c1-1.webp')`);
ok(await fails(A, `insert into storage.objects (bucket_id, name) values ('showcase', '${V}/sneaky.webp')`), "artist cannot upload into someone else's folder");
ok((await as(V, `select name from storage.objects`)).rows.length === 0, "viewer cannot read a waiting piece's image");

// Review
ok(await fails(V, `select review_showcase_work('${w.id}', 'approve')`), 'non-admin cannot review');
await as(ADMIN, `select review_showcase_work('${w.id}', 'approve')`);
const approved = (await as(V, `select status, featured_at is not null f from showcase_works`)).rows;
ok(approved.length === 1 && approved[0].status === 'live' && approved[0].f, 'approved piece is live and featured for viewers');
ok((await as(V, `select display_name from artist_profiles where user_id = '${A}'`)).rows[0]?.display_name === 'Ana', 'viewer sees the artist profile once live');
ok((await as(V, `select name from storage.objects`)).rows.length === 1, "viewer can read a live piece's image");
ok((await as(V, `select name from showcase_credits`)).rows.length === 1, 'viewer sees credits on a live piece');
ok(await fails(A, `insert into showcase_credits (work_id, name) values ('${w.id}', 'Late')`), 'credits cannot change on a live piece');

// Saves
ok(await fails(V, `insert into showcase_saves (work_id) values ('${w.id}')`), 'cannot save a contribution piece without "I\'ve contributed"');
await as(V, `insert into showcase_saves (work_id, contributed) values ('${w.id}', true)`);
ok((await as(A, `select * from showcase_save_counts()`)).rows[0]?.saves == 1, 'artist sees how many saved it');
ok((await as(A, `select * from showcase_saves`)).rows.length === 0, 'artist cannot see who saved it');

// Reports
await as(V, `insert into showcase_reports (work_id, reason) values ('${w.id}', 'not theirs?')`);
ok((await as(V, `select * from showcase_reports`)).rows.length === 0, 'reporter cannot read reports');
ok((await as(ADMIN, `select * from showcase_reports`)).rows.length === 1, 'admin reads reports');

// Kronk link on live piece doesn't reset; content edits do
await as(A, `update showcase_works set kronk_post_url = 'https://kronk.social/@ana/1' where id = '${w.id}'`);
ok((await as(A, `select status from showcase_works`)).rows[0].status === 'live', 'adding the Kronk post link keeps it live');
await as(A, `update showcase_works set submitted_at = now() + interval '1 minute' where id = '${w.id}'`);
ok((await as(A, `select status from showcase_works`)).rows[0].status === 'waiting', 'sharing again sends it back to waiting');
ok((await as(V, `select id from showcase_works`)).rows.length === 0, 'and viewers stop seeing it');
ok(await fails(V, `update showcase_works set title = 'mine' where id = '${w.id}'`) || (await as(V, `update showcase_works set title='x' where id='${w.id}' returning id`)).rows.length === 0, 'viewer cannot edit the piece');

// Unshare
await as(A, `delete from showcase_works where id = '${w.id}'`);
ok((await db.query(`select count(*)::int n from showcase_saves`)).rows[0].n === 0, 'unsharing removes it from collections');

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
