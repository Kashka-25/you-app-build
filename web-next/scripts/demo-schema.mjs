// Writes src/lib/demo/schema.json: every public table's columns and the
// defaults the database would fill in, read from the schema baseline. The
// demo's in-browser database (src/lib/demo/demoClient.js) uses it so a row
// saved in the demo looks like one saved for real (an id, created_at, a
// status that starts as 'active'…), without any network.
//
//   node scripts/demo-schema.mjs [path/to/baseline.sql]
//
// Re-run after the baseline changes (supabase/schema/snapshot.mjs).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || join(here, "..", "..", "supabase", "schema", "baseline.sql");
const sql = readFileSync(src, "utf8");

// A default the browser can reproduce, or undefined to leave it empty.
function defaultOf(expr) {
  const e = expr.trim();
  if (/^(now\(\)|CURRENT_TIMESTAMP|timezone\('utc'::text, now\(\)\))$/i.test(e)) return { fn: "now" };
  if (/^CURRENT_DATE$/i.test(e) || /^\(now\(\)\)::date$/i.test(e)) return { fn: "today" };
  if (/^(gen_random_uuid|uuid_generate_v4|extensions\.uuid_generate_v4)\(\)$/i.test(e)) return { fn: "uuid" };
  if (/^nextval\(/i.test(e)) return { fn: "serial" };
  if (/^(true|false)$/i.test(e)) return { value: e.toLowerCase() === "true" };
  if (/^-?\d+(\.\d+)?$/.test(e)) return { value: Number(e) };
  let m = e.match(/^\(?(-?\d+(?:\.\d+)?)\)?::(numeric|integer|bigint|smallint|real|double precision)$/i);
  if (m) return { value: Number(m[1]) };
  m = e.match(/^'((?:[^']|'')*)'::(text|character varying|varchar|date|jsonb|json|text\[\]|uuid\[\])$/i);
  if (m) {
    const raw = m[1].replace(/''/g, "'");
    const type = m[2].toLowerCase();
    if (type === "jsonb" || type === "json") { try { return { value: JSON.parse(raw) }; } catch { return undefined; } }
    if (type.endsWith("[]")) return raw === "{}" ? { value: [] } : undefined;
    return { value: raw };
  }
  if (/^ARRAY\[\]::/i.test(e)) return { value: [] };
  return undefined;
}

const tables = {};
const re = /create table if not exists public\.("?)([a-z0-9_]+)\1 \(\n([\s\S]*?)\n\);/g;
for (const [, , name, body] of sql.matchAll(re)) {
  const columns = [];
  const defaults = {};
  for (const line of body.split(",\n")) {
    const m = line.trim().match(/^"?([a-z0-9_]+)"?\s+(.+?)(?:\s+not null)?(?:\s+default\s+(.+))?$/i);
    if (!m) continue;
    const [, col, , def] = m;
    columns.push(col);
    if (def) { const d = defaultOf(def); if (d) defaults[col] = d; }
  }
  // Only what the demo needs: the defaults, and whether the table has an
  // id, an updated_at and a user_id (kept small: it ships in the app).
  tables[name] = {
    defaults,
    ...(columns.includes("id") && { id: 1 }),
    ...(columns.includes("updated_at") && { updated: 1 }),
    ...(columns.includes("user_id") && { user: 1 })
  };
}

const out = join(here, "..", "src", "lib", "demo", "schema.json");
writeFileSync(out, JSON.stringify(tables, null, 1) + "\n");
console.log(`Wrote ${out}: ${Object.keys(tables).length} tables`);
