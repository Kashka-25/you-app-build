import { beforeEach, describe, expect, it, vi } from "vitest";

// A plain in-memory localStorage: the demo keeps everything there.
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; }
};

const { createDemoClient } = await import("./demoClient");
const { buildDemoDatabase } = await import("./seed");
const { DEMO_USER_ID, DEMO_DB_KEY } = await import("./mode");

describe("the demo's in-browser database", () => {
  beforeEach(() => {
    store.clear();
    store.set(DEMO_DB_KEY, JSON.stringify(buildDemoDatabase("example", DEMO_USER_ID)));
  });

  it("never touches the network", async () => {
    const fetchSpy = vi.fn(() => { throw new Error("no network in the demo"); });
    globalThis.fetch = fetchSpy;
    const db = createDemoClient();
    await db.from("items").select("*").eq("user_id", DEMO_USER_ID);
    await db.from("journal_entries").insert({ user_id: DEMO_USER_ID, content: "Hello" }).select().single();
    await db.auth.getSession();
    await db.functions.invoke("journal-reflect", { body: {} });
    await db.storage.from("journal-photos").upload("x.jpg", new Uint8Array());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reads the example person, filtered and ordered", async () => {
    const db = createDemoClient();
    const { data, error } = await db.from("journal_entries").select("*").eq("user_id", DEMO_USER_ID).order("entry_date", { ascending: false });
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(3);
    expect(data[0].entry_date >= data[1].entry_date).toBe(true);
    const { data: profile } = await db.from("profiles").select("*").eq("user_id", DEMO_USER_ID).single();
    expect(profile.name).toBe("Wren");
  });

  it("saves new rows with the database's defaults, and keeps them", async () => {
    const db = createDemoClient();
    const { data } = await db.from("items").insert({ user_id: DEMO_USER_ID, name: "Learn a song", type: "goal", cat: "Play" }).select().single();
    expect(data.id).toBeTruthy();
    expect(data.done).toBe(false);
    expect(data.inserted_at).toBeTruthy();
    const again = createDemoClient(); // a reload
    const { data: found } = await again.from("items").select("*").eq("id", data.id).maybeSingle();
    expect(found.name).toBe("Learn a song");
  });

  it("updates, upserts on a chosen key and deletes", async () => {
    const db = createDemoClient();
    const { data: [entry] } = await db.from("journal_entries").select("*").limit(1);
    await db.from("journal_entries").update({ content: "Changed" }).eq("id", entry.id);
    expect((await db.from("journal_entries").select("*").eq("id", entry.id).single()).data.content).toBe("Changed");

    await db.from("ai_consent").upsert({ user_id: DEMO_USER_ID, granted: true });
    await db.from("ai_consent").upsert({ user_id: DEMO_USER_ID, granted: false });
    const { data: consent } = await db.from("ai_consent").select("*").eq("user_id", DEMO_USER_ID);
    expect(consent).toHaveLength(1);
    expect(consent[0].granted).toBe(false);

    await db.from("journal_entries").delete().eq("id", entry.id);
    expect((await db.from("journal_entries").select("*").eq("id", entry.id).maybeSingle()).data).toBeNull();
  });

  it("answers single() like Postgres when nothing matches", async () => {
    const db = createDemoClient();
    const { data, error } = await db.from("profiles").select("*").eq("user_id", "someone-else").single();
    expect(data).toBeNull();
    expect(error.code).toBe("PGRST116");
  });

  it("keeps preferences on the made-up account", async () => {
    const db = createDemoClient();
    await db.auth.updateUser({ data: { prefs: { welcomed: true, plugins: { focus: true } } } });
    const { data } = await createDemoClient().auth.getSession();
    expect(data.session.user.id).toBe(DEMO_USER_ID);
    expect(data.session.user.user_metadata.prefs.plugins.focus).toBe(true);
  });

  it("starts blank with no pursuits or entries", () => {
    const blank = buildDemoDatabase("blank", DEMO_USER_ID);
    expect(blank.tables.items).toBeUndefined();
    expect(blank.tables.journal_entries).toBeUndefined();
    expect(blank.user.user_metadata.prefs.welcomed).toBeUndefined();
  });
});
