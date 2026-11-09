// The demo's stand-in for the Supabase client (see mode.js). It answers the
// same calls the app makes (from().select/insert/update/upsert/delete with
// eq, in, order, limit, single…, plus auth, storage, functions and rpc) from
// tables kept in this browser's localStorage. It has no network code at all:
// in demo mode the real client is never created, so nothing reaches the
// real database. AI, photos and sending are switched off with a plain
// message, since they'd need a server.
import SCHEMA from "./schema.json";
import { DEMO_USER_ID, DEMO_DB_KEY, leaveDemo } from "./mode";

const OFF = "This is the demo: it runs only in this browser, so this needs the real YOU.";

function loadDb() {
  try {
    const db = JSON.parse(localStorage.getItem(DEMO_DB_KEY) || "null");
    if (db && db.tables) return db;
  } catch { /* fall through to an empty demo */ }
  return { tables: {}, user: null, serial: 1 };
}

const clone = v => (v == null ? v : JSON.parse(JSON.stringify(v)));
const pad = n => String(n).padStart(2, "0");
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "d" + Math.random().toString(16).slice(2) + Date.now().toString(16));

// Loose equality, as Postgres sees "5" and 5 in a filter.
const same = (a, b) => a === b || (a != null && b != null && String(a) === String(b));

export function createDemoClient() {
  const db = loadDb();
  const save = () => {
    try { localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db)); } catch { /* full or private: keep going in memory */ }
  };
  const table = name => (db.tables[name] ||= []);

  function withDefaults(name, row) {
    const out = { ...row };
    const defaults = SCHEMA[name]?.defaults || {};
    for (const [col, d] of Object.entries(defaults)) {
      if (out[col] !== undefined) continue;
      if (d.fn === "uuid") out[col] = uuid();
      else if (d.fn === "now") out[col] = new Date().toISOString();
      else if (d.fn === "today") out[col] = todayKey();
      else if (d.fn === "serial") out[col] = db.serial++;
      else out[col] = clone(d.value);
    }
    // Tables without a database default still get an id, so rows can be found again.
    if (out.id === undefined && SCHEMA[name]?.id) out.id = uuid();
    return out;
  }

  function touch(name, row) {
    if (SCHEMA[name]?.updated) row.updated_at = new Date().toISOString();
  }

  // The key an upsert matches on: its onConflict columns, else the id, else
  // user_id for one-row-per-person tables (user_xp, ai_consent…).
  function keyCols(name, row, onConflict) {
    if (onConflict) return onConflict.split(",").map(s => s.trim());
    if (row.id !== undefined) return ["id"];
    if (!SCHEMA[name]?.id && SCHEMA[name]?.user) return ["user_id"];
    return null;
  }

  // "*, journal_entries!inner(entry_date, content)": attach the related row.
  function embed(rows, cols) {
    const joins = [...(cols || "").matchAll(/([a-z_]+)(!inner)?\(([^)]*)\)/g)];
    if (!joins.length) return rows;
    return rows.flatMap(row => {
      const out = { ...row };
      for (const [, other, inner, fields] of joins) {
        const fk = `${other.replace(/s$/, "")}_id`;
        const match = table(other).find(o => same(o.id, row[fk]));
        if (!match && inner) return [];
        out[other] = match ? Object.fromEntries(fields.split(",").map(f => f.trim()).filter(Boolean).map(f => [f, match[f]])) : null;
      }
      return [out];
    });
  }

  class Query {
    constructor(name) {
      this.name = name;
      this.op = "select";
      this.filters = [];
      this.orders = [];
      this.cols = "*";
      this.returning = false;
    }
    select(cols = "*", opts = {}) {
      if (this.op === "select") { this.countWanted = opts.count; this.headOnly = opts.head; }
      else this.returning = true;
      this.cols = cols;
      return this;
    }
    insert(rows) { this.op = "insert"; this.payload = rows; return this; }
    upsert(rows, opts = {}) { this.op = "upsert"; this.payload = rows; this.onConflict = opts.onConflict; this.ignoreDuplicates = opts.ignoreDuplicates; return this; }
    update(patch) { this.op = "update"; this.payload = patch; return this; }
    delete() { this.op = "delete"; return this; }

    eq(c, v) { this.filters.push(r => same(r[c], v)); return this; }
    neq(c, v) { this.filters.push(r => !same(r[c], v)); return this; }
    in(c, vs) { const list = vs || []; this.filters.push(r => list.some(v => same(r[c], v))); return this; }
    is(c, v) { this.filters.push(r => (v === null ? r[c] == null : r[c] === v)); return this; }
    gt(c, v) { this.filters.push(r => r[c] != null && r[c] > v); return this; }
    gte(c, v) { this.filters.push(r => r[c] != null && r[c] >= v); return this; }
    lt(c, v) { this.filters.push(r => r[c] != null && r[c] < v); return this; }
    lte(c, v) { this.filters.push(r => r[c] != null && r[c] <= v); return this; }
    like(c, p) { const re = new RegExp("^" + String(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$"); this.filters.push(r => re.test(r[c] ?? "")); return this; }
    ilike(c, p) { const re = new RegExp("^" + String(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$", "i"); this.filters.push(r => re.test(r[c] ?? "")); return this; }
    contains(c, v) {
      this.filters.push(r => {
        const have = r[c];
        if (Array.isArray(v)) return Array.isArray(have) && v.every(x => have.some(h => same(h, x)));
        if (v && typeof v === "object") return have && Object.entries(v).every(([k, x]) => same(have[k], x));
        return same(have, v);
      });
      return this;
    }
    match(obj) { for (const [c, v] of Object.entries(obj || {})) this.eq(c, v); return this; }
    not(c, op, v) {
      const probe = new Query(this.name);
      if (typeof probe[op] === "function") probe[op](c, v);
      const f = probe.filters[0];
      if (f) this.filters.push(r => !f(r));
      return this;
    }
    // Only the simple form the app could use: "a.eq.x,b.is.null".
    or(expr) {
      const parts = String(expr).split(",").map(p => p.split("."));
      this.filters.push(r => parts.some(([c, op, ...rest]) => {
        const v = rest.join(".");
        if (op === "eq") return same(r[c], v);
        if (op === "is") return v === "null" ? r[c] == null : String(r[c]) === v;
        if (op === "neq") return !same(r[c], v);
        return false;
      }));
      return this;
    }
    filter(c, op, v) { return typeof this[op] === "function" ? this[op](c, v) : this; }
    order(c, { ascending = true, nullsFirst } = {}) { this.orders.push({ c, ascending, nullsFirst }); return this; }
    limit(n) { this.max = n; return this; }
    range(a, b) { this.from = a; this.to = b; return this; }
    single() { this.one = "single"; return this; }
    maybeSingle() { this.one = "maybe"; return this; }
    abortSignal() { return this; }
    returns() { return this; }
    throwOnError() { this.throws = true; return this; }

    matches(row) { return this.filters.every(f => f(row)); }

    run() {
      const rows = table(this.name);
      let data = null;
      let count = null;

      if (this.op === "select") {
        let out = rows.filter(r => this.matches(r));
        for (const { c, ascending, nullsFirst } of [...this.orders].reverse()) {
          out = [...out].sort((a, b) => {
            const x = a[c], y = b[c];
            if (x == null || y == null) return x == null && y == null ? 0 : (x == null) === Boolean(nullsFirst) ? -1 : 1;
            return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
          });
        }
        if (this.countWanted) count = out.length;
        if (this.from != null) out = out.slice(this.from, this.to + 1);
        if (this.max != null) out = out.slice(0, this.max);
        data = this.headOnly ? null : embed(clone(out), this.cols);
      } else if (this.op === "insert") {
        const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(r => withDefaults(this.name, r));
        rows.push(...list);
        data = this.returning ? clone(list) : null;
        save();
      } else if (this.op === "upsert") {
        const list = Array.isArray(this.payload) ? this.payload : [this.payload];
        const done = [];
        for (const r of list) {
          const keys = keyCols(this.name, r, this.onConflict);
          const found = keys && rows.find(x => keys.every(k => same(x[k], r[k])));
          if (found) {
            if (!this.ignoreDuplicates) { Object.assign(found, clone(r)); touch(this.name, found); }
            done.push(found);
          } else {
            const fresh = withDefaults(this.name, r);
            rows.push(fresh);
            done.push(fresh);
          }
        }
        data = this.returning ? clone(done) : null;
        save();
      } else if (this.op === "update") {
        const hit = rows.filter(r => this.matches(r));
        for (const r of hit) { Object.assign(r, clone(this.payload)); touch(this.name, r); }
        data = this.returning ? clone(hit) : null;
        save();
      } else if (this.op === "delete") {
        const keep = [], gone = [];
        for (const r of rows) (this.matches(r) ? gone : keep).push(r);
        db.tables[this.name] = keep;
        data = this.returning ? clone(gone) : null;
        save();
      }

      if (this.one) {
        const list = Array.isArray(data) ? data : [];
        if (list.length === 1) data = list[0];
        else if (this.one === "maybe" && list.length === 0) data = null;
        else {
          const error = { code: "PGRST116", message: list.length ? "More than one row" : "No rows found", details: null, hint: null };
          return { data: null, error, count, status: 406 };
        }
      }
      return { data, error: null, count, status: 200 };
    }

    then(resolve, reject) {
      return Promise.resolve()
        .then(() => {
          const res = this.run();
          if (this.throws && res.error) throw res.error;
          return res;
        })
        .then(resolve, reject);
    }
  }

  // ── Auth: one made-up demo account, already signed in ──
  if (!db.user) db.user = { id: DEMO_USER_ID, email: "demo@example.invalid", user_metadata: { prefs: {} } };
  const listeners = new Set();
  const session = () => ({
    access_token: "demo",
    token_type: "bearer",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: db.user.id,
      aud: "authenticated",
      role: "authenticated",
      email: db.user.email,
      email_confirmed_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      app_metadata: { provider: "demo" },
      user_metadata: clone(db.user.user_metadata)
    }
  });
  const off = async () => ({ data: { user: null, session: null }, error: { message: OFF } });

  const auth = {
    getSession: async () => ({ data: { session: session() }, error: null }),
    getUser: async () => ({ data: { user: session().user }, error: null }),
    onAuthStateChange(cb) {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
    async updateUser(attrs = {}) {
      if (attrs.password || attrs.email) return { data: { user: null }, error: { message: OFF } };
      if (attrs.data) db.user.user_metadata = { ...db.user.user_metadata, ...clone(attrs.data) };
      save();
      const user = session().user;
      return { data: { user }, error: null };
    },
    async signOut() { leaveDemo(); return { error: null }; },
    signInWithPassword: off,
    signUp: off,
    resend: off,
    resetPasswordForEmail: off,
    verifyOtp: off,
    signInWithOAuth: off,
    exchangeCodeForSession: off,
    refreshSession: async () => ({ data: { session: session() }, error: null })
  };

  // ── Storage: no uploads (photos would need a server); example art is a public path ──
  const storage = {
    from: () => ({
      upload: async () => ({ data: null, error: { message: "Photos aren't kept in the demo.", friendly: "Photos aren't kept in the demo, so this one wasn't added." } }),
      remove: async () => ({ data: [], error: null }),
      createSignedUrl: async path => ({ data: { signedUrl: String(path || "").startsWith("/") ? path : null }, error: null }),
      createSignedUrls: async paths => ({ data: (paths || []).map(p => ({ path: p, signedUrl: String(p).startsWith("/") ? p : null, error: null })), error: null }),
      getPublicUrl: path => ({ data: { publicUrl: String(path || "").startsWith("/") ? path : "" } })
    })
  };

  // ── Edge Functions (AI, feedback, Kronk…) and database functions ──
  const functions = {
    invoke: async () => ({ data: null, error: { message: "AI and sending are switched off in the demo, so nothing leaves this browser." } })
  };
  const rpc = async name => {
    if (name === "codex_word_requests") return { data: [], error: null };
    return { data: null, error: { message: OFF } };
  };

  const channel = () => {
    const ch = { on: () => ch, subscribe: () => ch, unsubscribe: async () => "ok" };
    return ch;
  };

  return {
    isDemo: true,
    from: name => new Query(name),
    rpc,
    auth,
    storage,
    functions,
    channel,
    removeChannel: async () => "ok",
    removeAllChannels: async () => []
  };
}
