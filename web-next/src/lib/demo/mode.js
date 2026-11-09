// YOU's demo (Cassidy, Nov 9): visitors from Creative Universe try YOU at
// /demo, as an example person or starting blank. In demo mode the whole
// app runs on a small database kept in this browser (demoClient.js): the
// real Supabase client is never created, so nothing is read from or sent
// to the real database, and real people's data can't be reached.
//
// Open to anyone, with no entry key (Cassidy, 9 Nov 2026).

const MODE_KEY = "you-demo";            // "example" | "blank" while in demo
const DB_KEY = "you-demo-db";           // the demo's tables (demoClient.js)
const BACK_KEY = "you-demo-back";       // where "Back to Creative Universe" goes

// A made-up account id, so demo rows can never match a real one.
export const DEMO_USER_ID = "00000000-0000-4000-8000-0000000d3e00";

// Creative Universe isn't deployed yet: its address comes from the link
// that opened the demo (/demo?from=…) or from VITE_CREATIVE_UNIVERSE_URL.
const DEFAULT_BACK = import.meta.env.VITE_CREATIVE_UNIVERSE_URL || "";

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* private window: the demo still runs for this visit */ }
}

// Decided once, when the app starts: switching in or out reloads the page.
const startedInDemo = read(MODE_KEY) === "example" || read(MODE_KEY) === "blank";
export const isDemo = () => startedInDemo;
export const demoKind = () => read(MODE_KEY);

export function demoBackUrl() {
  const saved = read(BACK_KEY);
  return saved || DEFAULT_BACK || "";
}

// Only an http(s) address can be the way back, never a script.
function safeBack(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch { return ""; }
}
export function rememberBack(url) {
  const ok = url && safeBack(url);
  if (ok) write(BACK_KEY, ok);
}

// Fill the demo database and open YOU in demo mode.
export async function enterDemo(kind) {
  const { buildDemoDatabase } = await import("./seed.js");
  write(DB_KEY, JSON.stringify(buildDemoDatabase(kind, DEMO_USER_ID)));
  write(MODE_KEY, kind);
  window.location.replace("/");
}

// Start the same demo again from the beginning.
export function resetDemo() {
  return enterDemo(demoKind() === "blank" ? "blank" : "example");
}

// Clear everything the demo kept in this browser and go back.
export function leaveDemo() {
  const back = demoBackUrl();
  write(MODE_KEY, null);
  write(DB_KEY, null);
  write(BACK_KEY, null);
  window.location.replace(back || "/demo");
}

export const DEMO_DB_KEY = DB_KEY;
