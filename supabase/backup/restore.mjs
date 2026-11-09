// YOU · restore a backup (from backup.mjs) into a FRESH Supabase project.
//
//   node supabase/backup/restore.mjs <backup folder>                       → writes restore-schema.sql + restore-data.sql only
//   node supabase/backup/restore.mjs <backup folder> --project-ref <ref>   → also runs them in that project
//
// <ref> is the target project's id (Dashboard → Project Settings, or
// `supabase projects list`). It goes through the Management API with the
// CLI's own sign-in, so no database password is needed, and the CLI's link
// to the live project isn't changed. It refuses the live project and any
// project that already has tables: this is for a fresh scratch project (a
// test restore) or for rebuilding after a disaster. (A --db-url connection
// can't run a file of many statements, which is why it isn't used.)
//
// Accounts come back with their ids, emails and prefs but no passwords
// (backups don't keep the hashes): people use "Forgot your password?".
// Files: link the CLI to the target, then from <backup>/storage run
//   supabase storage cp -r ./<bucket> ss:///<bucket> --experimental --linked
// for each bucket. Edge Functions and their secrets are deployed from the
// repo as usual; they aren't in a backup.
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { query, LIVE_REF } from "./cli.mjs";

const [dir, flag, ref] = process.argv.slice(2);
if (!dir || !existsSync(join(dir, "manifest.json"))) {
  console.error("Usage: node supabase/backup/restore.mjs <backup folder> [--project-ref <ref>]");
  process.exit(1);
}
if (flag && flag !== "--project-ref") throw new Error(`Unknown option ${flag}`);
if (flag && !/^[a-z]{20}$/.test(ref || "")) throw new Error("--project-ref needs a project id (20 lowercase letters).");
if (ref === LIVE_REF) {
  console.error("That's the live project. Restore only into a fresh, separate project.");
  process.exit(1);
}

// Dollar-quoting with a tag that can't occur in the data.
const tag = "$YOU_RESTORE_" + Math.random().toString(36).slice(2, 10) + "$";
const literal = text => {
  if (text.includes(tag)) throw new Error("Quote tag collision; run again.");
  return `${tag}${text}${tag}`;
};

// Statements are sent in batches. Each batch is its own transaction with
// triggers and foreign-key checks off, so rows go in as they were and
// table order doesn't matter.
const OPEN = "begin;\nset local session_replication_role = replica;";
const CLOSE = "commit;";
const BATCH_BYTES = 400 * 1024; // keeps each Management API request small
const lines = [];

const users = JSON.parse(readFileSync(join(dir, "auth", "users.json"), "utf8"));
lines.push(`insert into auth.users (instance_id, id, aud, role, email, phone, created_at, updated_at, email_confirmed_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data, is_anonymous)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, phone, created_at, updated_at, email_confirmed_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data, coalesce(is_anonymous, false)
from jsonb_to_recordset(${literal(JSON.stringify(users))}::jsonb) as u(id uuid, email text, phone text, created_at timestamptz, updated_at timestamptz, email_confirmed_at timestamptz, last_sign_in_at timestamptz, raw_user_meta_data jsonb, raw_app_meta_data jsonb, is_anonymous boolean)
on conflict (id) do nothing;`);

const identities = JSON.parse(readFileSync(join(dir, "auth", "identities.json"), "utf8"));
lines.push(`insert into auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at, last_sign_in_at)
select id, user_id, provider, provider_id, identity_data, created_at, updated_at, last_sign_in_at
from jsonb_to_recordset(${literal(JSON.stringify(identities))}::jsonb) as i(id uuid, user_id uuid, provider text, provider_id text, identity_data jsonb, created_at timestamptz, updated_at timestamptz, last_sign_in_at timestamptz)
on conflict do nothing;`);

const counts = {};
for (const file of readdirSync(join(dir, "data")).sort()) {
  const table = file.replace(/\.json$/, "");
  const rows = JSON.parse(readFileSync(join(dir, "data", file), "utf8"));
  counts[table] = rows.length;
  // A big table is split by rows so no single statement is too large.
  for (let i = 0; i < rows.length; ) {
    let j = i + 1, size = JSON.stringify(rows[i]).length;
    while (j < rows.length && size + JSON.stringify(rows[j]).length < BATCH_BYTES) size += JSON.stringify(rows[j++]).length;
    lines.push(`insert into public."${table}" select * from jsonb_populate_recordset(null::public."${table}", ${literal(JSON.stringify(rows.slice(i, j)))}::jsonb) on conflict do nothing;`);
    i = j;
  }
}

const batches = [];
for (const stmt of lines) {
  const last = batches[batches.length - 1];
  if (last && last.size + stmt.length < BATCH_BYTES) { last.stmts.push(stmt); last.size += stmt.length; }
  else batches.push({ stmts: [stmt], size: stmt.length });
}
const wrap = b => [OPEN, ...b.stmts, CLOSE].join("\n\n");

// Functions can call each other in any order (a public one may call one in
// you_private that's created later), so bodies aren't checked while the
// schema is rebuilt, the same as pg_dump does.
writeFileSync(join(dir, "restore-schema.sql"), "set check_function_bodies = false;\n\n" + readFileSync(join(dir, "schema.sql"), "utf8"));
writeFileSync(join(dir, "restore-data.sql"), ["-- Generated by supabase/backup/restore.mjs from " + basename(dir), ...batches.map(wrap)].join("\n\n") + "\n");
console.log(`Wrote restore-schema.sql and restore-data.sql in ${dir}`);

if (!ref) process.exit(0);

const target = ["--linked", "--project-ref", ref];
const [{ n: existing }] = query("select count(*)::int as n from pg_tables where schemaname = 'public'", target);
if (existing > 0) {
  console.error(`Project ${ref} already has ${existing} tables. Restore only into a fresh, empty project.`);
  process.exit(1);
}

console.log(`Restoring the schema into ${ref}…`);
query(readFileSync(join(dir, "restore-schema.sql"), "utf8"), target);
console.log(`Restoring accounts and rows in ${batches.length} batches…`);
batches.forEach((b, i) => {
  query(wrap(b), target);
  console.log(`  batch ${i + 1} of ${batches.length}`);
});

// Check every table's count against the manifest.
const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
let ok = true;
for (const [table, expected] of Object.entries(manifest.tables)) {
  const [{ n }] = query(`select count(*)::int as n from public."${table}"`, target);
  if (n !== expected) { ok = false; console.log(`  ${table}: ${n} of ${expected}`); }
}
const [{ n: userCount }] = query("select count(*)::int as n from auth.users", target);
if (userCount < manifest.auth.users) { ok = false; console.log(`  accounts: ${userCount} of ${manifest.auth.users}`); }
console.log(ok ? "Every table and account matches the backup." : "Some counts differ (above).");
process.exit(ok ? 0 : 1);
