// YOU without a signal (Cassidy, Oct 25: "all three levels, including
// keeping my data readable offline on the phone").
//
// Every database read and write goes through the Supabase client, so this
// sits in one place: the client's own fetch (see supabaseClient.js).
//
//  · Reads (GET /rest/v1/…): each answer is kept on this device in
//    IndexedDB, per account. With no signal, the kept answer is used, so
//    every screen you've opened before still shows your things.
//  · Writes (POST / PATCH / DELETE): with no signal (or while older changes
//    are still waiting), the change joins a queue on the device and the app
//    is told it worked. The kept reads are updated to match, so a reopened
//    app still shows it. When the signal is back, the queue is sent in
//    order and the app reloads from the server.
//  · New rows get their id here, before the first attempt, so sending the
//    same insert twice is harmless (the second is refused as a duplicate).
//
// Not offline: AI, page scans, photo uploads, Showcase, KommYOUnity, and
// signing in. Signing out clears everything kept here.

const DB_NAME = "you-offline";
const DB_VERSION = 1;
const READS = "reads";
const QUEUE = "queue";
const READ_TIMEOUT_MS = 8000;

// Tables whose id is a uuid the database would otherwise make itself.
const UUID_TABLES = new Set([
  "items", "memory", "mood_log", "user_values", "life_moments", "life_chapters", "value_challenges",
  "journal_entries", "identity_visions", "todos", "week_intentions", "week_harvests", "wanderings",
  "wandering_stops", "seasons", "value_compass", "focus_sessions", "journal_highlights", "journal_ai_insights",
  "weekly_reflections", "reflections", "own_tools", "tool_uses", "value_words", "beta_feedback", "client_errors",
  "projects", "project_notes"
]);

// ── IndexedDB, kept tiny ────────────────────────────────────────────────
let dbPromise = null;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(READS)) d.createObjectStore(READS, { keyPath: "key" });
        if (!d.objectStoreNames.contains(QUEUE)) d.createObjectStore(QUEUE, { keyPath: "seq", autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
async function tx(store, mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    Promise.resolve(fn(s)).then(r => { result = r; });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}
const req2p = r => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
const getRead = key => tx(READS, "readonly", s => req2p(s.get(key)));
const putRead = rec => tx(READS, "readwrite", s => req2p(s.put(rec)));
const allReads = () => tx(READS, "readonly", s => req2p(s.getAll()));
const allQueued = () => tx(QUEUE, "readonly", s => req2p(s.getAll()));
const addQueued = rec => tx(QUEUE, "readwrite", s => req2p(s.add(rec)));
const delQueued = seq => tx(QUEUE, "readwrite", s => req2p(s.delete(seq)));

// ── helpers ─────────────────────────────────────────────────────────────
const nativeFetch = (...args) => window.fetch(...args);
const isRest = url => url.includes("/rest/v1/") && !url.includes("/rest/v1/rpc/");
const tableOf = url => new URL(url).pathname.split("/rest/v1/")[1]?.split("/")[0] || "";
const looksOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

function headerObj(h) {
  const out = {};
  if (!h) return out;
  if (h instanceof Headers) h.forEach((v, k) => { out[k.toLowerCase()] = v; });
  else if (Array.isArray(h)) h.forEach(([k, v]) => { out[k.toLowerCase()] = v; });
  else Object.entries(h).forEach(([k, v]) => { out[k.toLowerCase()] = v; });
  return out;
}

// The signed-in account, from the request's own token, so one person's
// kept data can never answer another's on a shared device. Offline, once
// the hour-long token has run out, requests go out unsigned; then the
// account last signed in on this device stands in (cleared on sign-out).
const LAST_USER = "you.offline.user";
function userFrom(headers) {
  const token = (headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.role === "authenticated" && payload.sub) {
      try { localStorage.setItem(LAST_USER, payload.sub); } catch { /* private window */ }
      return payload.sub;
    }
  } catch { /* no token */ }
  return null;
}
function lastUser() {
  try { return localStorage.getItem(LAST_USER); } catch { return null; }
}

// Ids named by a filter like id=eq.X or id=in.(X,Y).
function idsFromUrl(url) {
  const v = new URL(url).searchParams.get("id");
  if (!v) return null;
  if (v.startsWith("eq.")) return [v.slice(3)];
  if (v.startsWith("in.(")) return v.slice(4, -1).split(",").map(s => s.replace(/"/g, ""));
  return null;
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new TypeError("timed out")), ms))]);
}

// ── status, for the banner ──────────────────────────────────────────────
let pending = 0;
let syncing = false;
const listeners = new Set();
function announce() { listeners.forEach(fn => fn({ pending, syncing })); }
export function onOfflineStatus(fn) {
  listeners.add(fn);
  fn({ pending, syncing });
  return () => listeners.delete(fn);
}
async function recount() {
  try { pending = (await allQueued()).length; } catch { pending = 0; }
  announce();
}

// ── reads ───────────────────────────────────────────────────────────────
async function handleRead(url, init, headers) {
  const user = userFrom(headers);
  const keyFor = u => `${u || "anon"}|${headers.accept || ""}|${url}`;
  const key = keyFor(user);
  const keptFallback = () => getRead(user ? key : keyFor(lastUser())).catch(() => null);
  if (!looksOffline()) {
    try {
      const res = await withTimeout(nativeFetch(url, init), READ_TIMEOUT_MS);
      if (res.ok && user) {
        const body = await res.clone().text();
        putRead({ key, user, table: tableOf(url), url, accept: headers.accept || "", status: res.status, range: res.headers.get("content-range"), type: res.headers.get("content-type"), body, at: Date.now() }).catch(() => {});
      }
      // A good answer means the signal is back: send anything waiting.
      if (res.ok && pending > 0) syncQueue();
      return res;
    } catch (err) {
      const kept = await keptFallback();
      if (kept) return keptResponse(kept);
      throw err;
    }
  }
  const kept = await keptFallback();
  if (kept) return keptResponse(kept);
  throw new TypeError("Offline, and this hasn't been opened on this device before.");
}

function keptResponse(kept) {
  const h = { "content-type": kept.type || "application/json", "x-you-offline": "1" };
  if (kept.range) h["content-range"] = kept.range;
  return new Response(kept.body, { status: kept.status || 200, headers: h });
}

// ── writes ──────────────────────────────────────────────────────────────
function prepareBody(url, method, headers, body) {
  if (method !== "POST" || typeof body !== "string") return body;
  const table = tableOf(url);
  // Upserts can match an existing row by other columns; a new id there
  // would rewrite that row's id, so only plain inserts get one.
  if (!UUID_TABLES.has(table) || /resolution=/.test(headers.prefer || "")) return body;
  try {
    const parsed = JSON.parse(body);
    const give = r => (r && typeof r === "object" && !r.id ? { ...r, id: crypto.randomUUID() } : r);
    return JSON.stringify(Array.isArray(parsed) ? parsed.map(give) : give(parsed));
  } catch { return body; }
}

async function handleWrite(url, init, headers, method) {
  const body = prepareBody(url, method, headers, init?.body);
  const sendInit = { ...init, body };
  if (!looksOffline() && pending === 0) {
    try {
      return await nativeFetch(url, sendInit);
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      // fall through: no signal after all
    }
  }
  const user = userFrom(headers) || lastUser();
  if (!user) throw new TypeError("Offline");
  const keepHeaders = { ...headers };
  delete keepHeaders.authorization;
  await addQueued({ url, method, headers: keepHeaders, body, user, at: Date.now() });
  const rows = await applyToKept(user, url, method, body);
  await recount();
  if (!looksOffline()) syncQueue();
  return queuedResponse(headers, method, rows);
}

function queuedResponse(headers, method, rows) {
  const wantsRows = /return=representation/.test(headers.prefer || "");
  const single = (headers.accept || "").includes("vnd.pgrst.object");
  const h = { "content-type": "application/json", "x-you-queued": "1" };
  if (!wantsRows) return new Response(null, { status: method === "POST" ? 201 : 204, headers: h });
  return new Response(JSON.stringify(single ? rows[0] || null : rows), { status: method === "POST" ? 201 : 200, headers: h });
}

// Make the kept reads match the change, and work out the rows the app
// expects back.
async function applyToKept(user, url, method, body) {
  const table = tableOf(url);
  const now = new Date().toISOString();
  let incoming = [];
  try { const p = body ? JSON.parse(body) : null; incoming = p ? (Array.isArray(p) ? p : [p]) : []; } catch { /* not JSON */ }
  const ids = idsFromUrl(url);
  const kept = (await allReads().catch(() => [])).filter(r => r.user === user && r.table === table);

  // What the rows look like now, as far as this device knows.
  const known = new Map();
  for (const r of kept) {
    try {
      const v = JSON.parse(r.body);
      (Array.isArray(v) ? v : v ? [v] : []).forEach(row => row?.id && known.set(row.id, row));
    } catch { /* skip */ }
  }

  let rows;
  if (method === "POST") {
    rows = incoming.map(r => ({ inserted_at: now, created_at: now, ...(r.id && known.get(r.id)), ...r }));
  } else if (method === "PATCH") {
    const patch = incoming[0] || {};
    rows = ids ? ids.map(id => ({ ...(known.get(id) || { id }), ...patch })) : [patch];
  } else {
    rows = ids ? ids.map(id => known.get(id)).filter(Boolean) : [];
  }

  for (const r of kept) {
    let v;
    try { v = JSON.parse(r.body); } catch { continue; }
    const list = Array.isArray(v);
    let arr = list ? v : v ? [v] : [];
    if (method === "POST") {
      if (!list) continue;
      const byId = new Map(rows.filter(x => x.id).map(x => [x.id, x]));
      arr = arr.map(x => (byId.has(x.id) ? { ...x, ...byId.get(x.id) } : x));
      const have = new Set(arr.map(x => x.id));
      arr = [...rows.filter(x => !x.id || !have.has(x.id)), ...arr];
    } else if (method === "PATCH" && ids) {
      arr = arr.map(x => (ids.includes(x.id) ? { ...x, ...(incoming[0] || {}) } : x));
    } else if (method === "DELETE" && ids) {
      arr = arr.filter(x => !ids.includes(x.id));
    } else continue;
    r.body = JSON.stringify(list ? arr : arr[0] ?? null);
    await putRead(r).catch(() => {});
  }
  return rows;
}

// ── sending the queue ───────────────────────────────────────────────────
let getToken = async () => null;
export function setTokenSource(fn) { getToken = fn; }

export async function syncQueue() {
  if (syncing || looksOffline()) return;
  syncing = true;
  announce();
  let sent = 0;
  try {
    const items = (await allQueued()).sort((a, b) => a.seq - b.seq);
    for (const item of items) {
      const token = await getToken();
      if (!token) break; // not signed in yet; try again later
      let res;
      try {
        res = await nativeFetch(item.url, { method: item.method, headers: { ...item.headers, authorization: `Bearer ${token}` }, body: item.body });
      } catch { break; } // still no signal
      if (res.status === 401 || res.status >= 500) break;
      // Done, or refused for good (a duplicate, or a row already gone):
      // either way it can't be sent again, so it leaves the queue.
      if (!res.ok) console.warn("[offline] a queued change was refused:", res.status, item.method, tableOf(item.url));
      await delQueued(item.seq);
      sent++;
    }
  } finally {
    syncing = false;
    await recount();
    if (sent > 0) window.dispatchEvent(new CustomEvent("you:synced", { detail: { sent } }));
  }
}

// ── the fetch the Supabase client uses ──────────────────────────────────
export function offlineFetch(input, init = {}) {
  const url = typeof input === "string" ? input : input.url;
  const method = (init.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
  if (!isRest(url) || typeof indexedDB === "undefined") return nativeFetch(input, init);
  const headers = headerObj(init.headers || (typeof input !== "string" && input.headers));
  if (method === "GET" || method === "HEAD") return handleRead(url, init, headers);
  return handleWrite(url, init, headers, method);
}

// Signing out: nothing personal stays on the device.
export async function clearOfflineData() {
  try {
    await tx(READS, "readwrite", s => req2p(s.clear()));
    await tx(QUEUE, "readwrite", s => req2p(s.clear()));
  } catch { /* nothing kept */ }
  try { localStorage.removeItem(LAST_USER); } catch { /* private window */ }
  await recount();
}

export async function pendingCount() {
  await recount();
  return pending;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => syncQueue());
  recount();
}
