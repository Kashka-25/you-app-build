// YOU · full backup of the live project, on the Free plan, without Docker.
//
//   node supabase/backup/backup.mjs                 → ~/YOU-backups/<date>/
//   node supabase/backup/backup.mjs D:/my-backups   → D:/my-backups/<date>/
//   (or set YOU_BACKUP_DIR)
//
// What it saves (read-only; nothing in the database changes):
//   schema.sql           the live schema (same as supabase/schema/baseline.sql)
//   data/<table>.json    every row of every table in `public`
//   auth/users.json      accounts: id, email, dates, prefs (user_metadata).
//                        Password hashes and tokens are left out on purpose,
//                        so after a restore people set a new password.
//   auth/identities.json how each account signs in (email, Kronk…)
//   storage/<bucket>/…   every file: journal pages, memory photos, Showcase
//   manifest.json        counts per table and bucket, to check a restore
//
// The backup holds everyone's private writing. Keep it out of git (it's
// written outside the repo) and somewhere only Cassidy can reach.
//
// Needs: the Supabase CLI signed in and linked to the live project.
import { mkdirSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { supabase, query, LIVE_REF } from "./cli.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const PAGE = 500;

function localDate() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

const base = process.argv[2] || process.env.YOU_BACKUP_DIR || join(homedir(), "YOU-backups");
const out = join(base, localDate());
for (const d of ["data", "auth", "storage"]) mkdirSync(join(out, d), { recursive: true });
console.log(`Backing up ${LIVE_REF} → ${out}`);

// Rows of one relation, a page at a time, ordered by its first column so
// the pages don't overlap.
function allRows(relation, columns = "*") {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = query(
      `select coalesce(json_agg(t), '[]'::json) as j from (select ${columns} from ${relation} order by 1 limit ${PAGE} offset ${offset}) t`
    )[0].j;
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

const manifest = { project: LIVE_REF, taken_at: new Date().toISOString(), tables: {}, auth: {}, storage: {} };

// 1 · schema
const schemaRows = query(readFileSync(join(here, "..", "schema", "snapshot.sql"), "utf8"));
writeFileSync(join(out, "schema.sql"), schemaRows.map(r => r.ddl).join("\n\n") + "\n");
console.log(`  schema: ${schemaRows.length} statements`);

// 2 · every public table
const tables = query(
  `select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r','p') order by 1`
).map(r => r.name);
for (const t of tables) {
  const rows = allRows(`public.${JSON.stringify(t)}`);
  writeFileSync(join(out, "data", `${t}.json`), JSON.stringify(rows));
  manifest.tables[t] = rows.length;
  console.log(`  ${t}: ${rows.length}`);
}

// 3 · accounts (no password hashes or tokens)
const users = allRows(
  "auth.users",
  "id, email, phone, created_at, updated_at, email_confirmed_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data, is_anonymous, banned_until, deleted_at"
);
writeFileSync(join(out, "auth", "users.json"), JSON.stringify(users));
const identities = allRows("auth.identities", "id, user_id, provider, provider_id, identity_data, created_at, updated_at, last_sign_in_at");
writeFileSync(join(out, "auth", "identities.json"), JSON.stringify(identities));
manifest.auth = { users: users.length, identities: identities.length };
console.log(`  accounts: ${users.length}, sign-in identities: ${identities.length}`);

// 4 · storage files, bucket by bucket
const objects = query(`select bucket_id, count(*)::int as n from storage.objects group by 1 order by 1`);
for (const { bucket_id, n } of objects) {
  const dest = join(out, "storage", bucket_id);
  mkdirSync(dest, { recursive: true });
  // The CLI reads a Windows drive letter as a remote, so it downloads into
  // a relative path from inside storage/; --workdir finds the linked project.
  supabase(["storage", "cp", "-r", `ss:///${bucket_id}`, `./${bucket_id}`, "--experimental", "--linked", "--workdir", root],
    { cwd: join(out, "storage") });
  const got = countFiles(dest);
  manifest.storage[bucket_id] = { expected: n, saved: got };
  console.log(`  storage ${bucket_id}: ${got} of ${n} files`);
}

function countFiles(dir) {
  return readdirSync(dir).reduce((sum, name) => {
    const p = join(dir, name);
    return sum + (statSync(p).isDirectory() ? countFiles(p) : 1);
  }, 0);
}

writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2));

const short = Object.entries(manifest.storage).filter(([, s]) => s.saved < s.expected);
if (short.length) {
  console.error(`\nSome files didn't download: ${short.map(([b, s]) => `${b} ${s.saved}/${s.expected}`).join(", ")}`);
  process.exit(1);
}
console.log(`\nDone. ${tables.length} tables, ${users.length} accounts, ${objects.reduce((s, o) => s + o.n, 0)} files.`);
