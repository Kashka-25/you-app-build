// Small helpers shared by backup.mjs and restore.mjs: run the Supabase CLI
// and read the JSON it prints. Read-only unless a caller sends a write.
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const LIVE_REF = "yikoymzktspamahrsuje";

const quote = a => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);

// The CLI is a .cmd shim on Windows, so it needs a shell; arguments are
// quoted here so paths with spaces still arrive whole.
export function supabase(args, opts = {}) {
  const win = process.platform === "win32";
  const cmd = win ? ["supabase", ...args].map(quote).join(" ") : "supabase";
  return execFileSync(cmd, win ? [] : args, {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    shell: win,
    stdio: ["ignore", "pipe", "pipe"],
    ...opts
  });
}

// Each `db query --linked` signs in afresh through the connection pooler,
// and after a few dozen sign-ins in a row the pooler starts refusing or
// timing out for a while. Those failures are retried after a pause.
// Queries are also spaced out a little so the pooler isn't hit back to back.
// A real SQL error ("Failed to run sql query") is never retried.
const TRANSIENT = /failed to connect|failed to initialise login role|TransportError|timed out|password authentication failed|too many connections|ECONNRESET/i;
const SQL_ERROR = /Failed to run sql query/i;
const WAITS = [15, 30, 60, 120, 180]; // seconds between attempts
const GAP = 1.5; // seconds between queries
const pause = s => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s * 1000);
let last = 0;

// Run SQL through the Management API (`db query`) and return the rows.
// `target` is ["--linked"] for the live project or ["--db-url", url].
export function query(sql, target = ["--linked"]) {
  const since = (Date.now() - last) / 1000;
  if (since < GAP) pause(GAP - since);
  try { return queryWithRetries(sql, target); } finally { last = Date.now(); }
}

function queryWithRetries(sql, target) {
  for (let attempt = 0; ; attempt++) {
    try {
      return queryOnce(sql, target);
    } catch (e) {
      if (attempt >= WAITS.length || SQL_ERROR.test(e.message) || !TRANSIENT.test(e.message)) throw e;
      console.log(`  (the database didn't answer; trying again in ${WAITS[attempt]} s)`);
      pause(WAITS[attempt]);
    }
  }
}

function queryOnce(sql, target) {
  const dir = mkdtempSync(join(tmpdir(), "you-sql-"));
  const file = join(dir, "q.sql");
  writeFileSync(file, sql);
  try {
    const out = supabase(["db", "query", ...target, "-o", "json", "-f", file]);
    const start = out.indexOf("{");
    if (start === -1) throw new Error(out.trim() || "No answer from the database.");
    const parsed = JSON.parse(out.slice(start));
    if (parsed.message && !parsed.rows) throw new Error(parsed.message);
    return parsed.rows || [];
  } catch (e) {
    const detail = e.stderr ? String(e.stderr).split("\n").filter(l => !/new version|recommend updating/i.test(l)).join("\n") : "";
    throw new Error(`${e.message}${detail ? `\n${detail}` : ""}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
