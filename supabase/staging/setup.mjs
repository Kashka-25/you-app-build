// YOU · build the staging database's structure from the live one.
//
//   node supabase/staging/setup.mjs --project-ref <staging ref>
//
// Reads the live schema (supabase/schema/snapshot.sql: tables, private
// schemas, sequences, functions and who may call them, triggers, RLS
// policies, storage buckets) and creates it in the staging project.
// Structure only: no rows, no accounts, no files ever leave live, so
// staging holds test accounts and test data only.
//
// Read-only on live. It refuses to run against the live project or any
// project that already has tables, so it can't overwrite anything. Uses
// the Supabase CLI's own sign-in (no database password). To bring staging
// up to date after a live migration, paste that migration into staging's
// SQL editor too; to start over, reset the staging project and run this.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { query, LIVE_REF } from "../backup/cli.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const [flag, ref] = process.argv.slice(2);
if (flag !== "--project-ref" || !/^[a-z]{20}$/.test(ref || "")) {
  console.error("Usage: node supabase/staging/setup.mjs --project-ref <staging project ref>");
  process.exit(1);
}
if (ref === LIVE_REF) {
  console.error("That's the live project. This builds a separate staging project.");
  process.exit(1);
}

const staging = ["--linked", "--project-ref", ref];
const APP_SCHEMAS = "('public','you_private','yourigin_private')";

const [{ n: existing }] = query(`select count(*)::int as n from pg_tables where schemaname in ${APP_SCHEMAS}`, staging);
if (existing > 0) {
  console.error(`Project ${ref} already has ${existing} tables. Run this only on an empty project.`);
  process.exit(1);
}

console.log("Reading the live structure (no data)…");
const ddl = query(readFileSync(join(here, "..", "schema", "snapshot.sql"), "utf8")).map(r => r.ddl);
console.log(`  ${ddl.length} statements`);

console.log(`Building it in ${ref}…`);
// Functions can call each other in any order, so bodies aren't checked
// while the structure is built (as pg_dump does).
query("set check_function_bodies = false;\n\n" + ddl.join("\n\n"), staging);

// The same shape on both sides, the security parts especially.
const shape = `select
  (select count(*) from pg_tables where schemaname in ${APP_SCHEMAS})::int as tables,
  (select count(*) from pg_tables where schemaname = 'public' and rowsecurity)::int as rls_on,
  (select count(*) from pg_policies where schemaname in ${APP_SCHEMAS} or schemaname = 'storage')::int as policies,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ${APP_SCHEMAS})::int as functions,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and not has_function_privilege('anon', p.oid, 'execute'))::int as locked_from_anon,
  (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where not t.tgisinternal and (n.nspname in ${APP_SCHEMAS} or (n.nspname = 'auth' and c.relname = 'users')))::int as triggers,
  (select count(*) from storage.buckets)::int as buckets,
  (select count(*) from auth.users)::int as accounts`;
const [live] = query(shape);
const [built] = query(shape, staging);
let same = true;
for (const k of Object.keys(live)) {
  if (k === "accounts") continue; // staging starts with none, on purpose
  const ok = live[k] === built[k];
  if (!ok) same = false;
  console.log(`  ${k.padEnd(17)} live ${String(live[k]).padStart(4)}  staging ${String(built[k]).padStart(4)}${ok ? "" : "  ← differs"}`);
}
console.log(`  ${"accounts".padEnd(17)} live ${String(live.accounts).padStart(4)}  staging ${String(built.accounts).padStart(4)}  (no accounts are copied)`);
console.log(same ? "Staging has the same structure as live, and no data." : "Some counts differ (above).");
process.exit(same ? 0 : 1);
