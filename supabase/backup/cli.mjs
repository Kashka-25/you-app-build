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

// Run SQL through the Management API (`db query`) and return the rows.
// `target` is ["--linked"] for the live project or ["--db-url", url].
export function query(sql, target = ["--linked"]) {
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
