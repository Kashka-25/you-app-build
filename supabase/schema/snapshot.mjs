// Writes supabase/schema/baseline.sql: the live schema of YOU's database
// (tables, constraints, indexes, functions, triggers, RLS policies, storage
// buckets), read through the Supabase CLI. Read-only. No Docker needed.
//
//   node supabase/schema/snapshot.mjs
//
// Needs the Supabase CLI, signed in (`supabase login`) and linked to the
// project (`supabase link --project-ref yikoymzktspamahrsuje`). Run it after
// every migration you paste into the SQL editor, then commit baseline.sql,
// so the repo always says what the database really is.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

const out = execFileSync(
  "supabase",
  ["db", "query", "--linked", "-o", "json", "-f", join(here, "snapshot.sql")],
  { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32" }
);
const json = out.slice(out.indexOf("{"));
const { rows } = JSON.parse(json);
if (!Array.isArray(rows) || rows.length === 0) throw new Error("No rows came back from the database.");

const header = `-- YOU · live database schema (public + storage policies)
-- Generated ${new Date().toISOString().slice(0, 10)} by supabase/schema/snapshot.mjs. Do not edit by hand.
-- A record of what the database is, not a migration: never run it against
-- the live project. To rebuild a fresh project (e.g. a separate staging
-- database), run it there first, then nothing else is needed.
`;
writeFileSync(join(here, "baseline.sql"), header + "\n" + rows.map(r => r.ddl).join("\n\n") + "\n");
console.log(`Wrote supabase/schema/baseline.sql (${rows.length} statements).`);
