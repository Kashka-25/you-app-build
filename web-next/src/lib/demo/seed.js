// What the demo starts with (lib/demo/mode.js). "example" is Wren, a
// made-up Seeker a few weeks into YOU: every name, place and line here is
// invented and isn't about Cassidy or anyone real. "blank" is a new Seeker
// who hasn't been welcomed yet. Dates are counted back from today, so the
// example always looks current. Loaded only when someone enters the demo.

const pad = n => String(n).padStart(2, "0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const dk = n => keyOf(daysAgo(n));
const iso = (n, hour = 9) => { const d = daysAgo(n); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
const nice = n => daysAgo(n).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
// Monday-first slot of a day in this week (0 = Monday), or -1 if before it.
const slotOf = n => {
  const d = daysAgo(n);
  const today = daysAgo(0);
  const mondayOffset = (today.getDay() + 6) % 7;
  return n <= mondayOffset ? (d.getDay() + 6) % 7 : -1;
};

let seq = 0;
const id = () => {
  seq += 1;
  return `d3e0${pad(seq)}00-0000-4000-8000-${String(seq).padStart(12, "0")}`;
};

export function buildDemoDatabase(kind, userId) {
  seq = 0;
  const base = { tables: {}, serial: 1000 };
  if (kind === "blank") {
    // The welcome and first steps, exactly as a new Seeker sees them.
    base.user = { id: userId, email: "demo@example.invalid", user_metadata: { prefs: { simple_v1: true, plugins: {}, nav: {} } } };
    base.tables.profiles = [{ id: id(), user_id: userId, name: null, inserted_at: iso(0), updated_at: iso(0) }];
    return base;
  }
  return exampleDatabase(base, userId);
}

function exampleDatabase(db, userId) {
  const u = { user_id: userId };
  db.user = {
    id: userId,
    email: "demo@example.invalid",
    user_metadata: { prefs: { welcomed: true, simple_v1: true, plugins: {}, nav: {} } }
  };
  const t = db.tables;

  t.profiles = [{ id: id(), ...u, name: "Wren", bio: "Learning to make things slowly.", location: "A town by a river", inserted_at: iso(30), updated_at: iso(2) }];

  // ── Pursuits ──
  const walk = id(), pages = id(), still = id(), pottery = id(), train = id(), market = id(), zine = id(), herbs = id();
  const habit = (hid, name, cat, logDays, extra = {}) => {
    const days = [false, false, false, false, false, false, false];
    for (const n of logDays) { const s = slotOf(n); if (s >= 0) days[s] = true; }
    return {
      id: hid, ...u, name, type: "habit", cat, subcat: "", note: "", tags: [], intention: extra.intention || "",
      milestones: [], daily_target: extra.target || null, done: false, streak: days.filter(Boolean).length, days,
      last_checkin: logDays.length ? dk(Math.min(...logDays)) : null,
      created: nice(24), created_date: dk(24), inserted_at: iso(24)
    };
  };
  const walkDays = [1, 2, 3, 5, 6, 8, 9, 10, 12, 13];
  const pagesDays = [1, 2, 4, 5, 6, 7, 9, 11, 12, 14, 15];
  const stillDays = [2, 3, 6, 9, 13];
  t.items = [
    habit(walk, "Walk by the river", "Body", walkDays, { intention: "Fresh air before the screen goes on." }),
    habit(pages, "Morning pages", "Mind", pagesDays, { intention: "Three pages, no rereading." }),
    habit(still, "Ten minutes of stillness", "Spirit", stillDays, { target: { amount: 10, unit: "minutes" } }),
    {
      id: pottery, ...u, name: "Finish the beginner pottery course", type: "goal", cat: "Play", subcat: "", note: "Thursday evenings at the community studio.",
      tags: [], intention: "", daily_target: null, done: false, streak: 0, days: [false, false, false, false, false, false, false], last_checkin: null,
      milestones: [
        { id: id(), text: "Book the class", done: true },
        { id: id(), text: "Centre the clay without it wobbling", done: true },
        { id: id(), text: "Make a bowl that holds water", done: false },
        { id: id(), text: "Glaze three pieces", done: false }
      ],
      created: nice(21), created_date: dk(21), inserted_at: iso(21)
    },
    {
      id: train, ...u, name: "Save for a slow trip by train", type: "goal", cat: "Purpose", subcat: "", note: "", tags: [], intention: "",
      daily_target: null, done: false, streak: 0, days: [false, false, false, false, false, false, false], last_checkin: null,
      milestones: [{ id: id(), text: "Pick the route", done: true }, { id: id(), text: "Put a little aside each payday", done: false }],
      created: nice(18), created_date: dk(18), inserted_at: iso(18)
    },
    {
      id: market, ...u, name: "Sell a few pieces at a weekend market", type: "dream", cat: "Purpose", subcat: "", note: "One table, one morning. That would be enough.",
      tags: [], intention: "", daily_target: null, done: false, streak: 0, days: [false, false, false, false, false, false, false], last_checkin: null,
      milestones: [], created: nice(16), created_date: dk(16), inserted_at: iso(16)
    },
    {
      id: zine, ...u, name: "A little zine of river sketches", type: "idea", cat: "Play", subcat: "", note: "", tags: [], intention: "",
      daily_target: null, done: false, streak: 0, days: [false, false, false, false, false, false, false], last_checkin: null,
      milestones: [], created: nice(4), created_date: dk(4), inserted_at: iso(4)
    },
    {
      id: herbs, ...u, name: "Plant a herb box on the balcony", type: "goal", cat: "Home & Earth", subcat: "", note: "", tags: [], intention: "",
      daily_target: null, done: true, streak: 0, days: [false, false, false, false, false, false, false], last_checkin: null,
      milestones: [], created: nice(20), created_date: dk(20), inserted_at: iso(20)
    }
  ];

  // Each day's check-in, as the habit cards and Home read them.
  t.habit_logs = [
    ...walkDays.map(n => ({ id: id(), ...u, item_id: walk, day: dk(n), step: "habit", amount: null, created_at: iso(n, 8), updated_at: iso(n, 8) })),
    ...pagesDays.map(n => ({ id: id(), ...u, item_id: pages, day: dk(n), step: "habit", amount: null, created_at: iso(n, 7), updated_at: iso(n, 7) })),
    ...stillDays.map(n => ({ id: id(), ...u, item_id: still, day: dk(n), step: "habit", amount: n % 2 ? 12 : 10, created_at: iso(n, 21), updated_at: iso(n, 21) }))
  ];

  // ── XP: what grew each Pillar ──
  const mem = [];
  const thisWeek = (item, name, n) => {
    const s = slotOf(n);
    return s >= 0 ? `${name} (check-in #${s} cycle 0)` : `${name} (check-in)`;
  };
  for (const n of walkDays) mem.push({ name: thisWeek(walk, "Walk by the river", n), type: "habit", xp: 10, n, cat: "Body" });
  for (const n of pagesDays) mem.push({ name: thisWeek(pages, "Morning pages", n), type: "habit", xp: 10, n, cat: "Mind" });
  for (const n of stillDays) mem.push({ name: thisWeek(still, "Ten minutes of stillness", n), type: "habit", xp: 10, n, cat: "Spirit" });
  mem.push({ name: "Plant a herb box on the balcony", type: "goal", xp: 25, n: 11, cat: "Home & Earth" });
  mem.push({ name: "Centre the clay without it wobbling", type: "milestone", xp: 10, n: 7, cat: "Play" });
  for (const n of [1, 3, 5, 8, 10, 14]) mem.push({ name: "Wrote in YOUrnal", type: "journal", xp: 5, n, cat: "Heart" });
  mem.push({ name: "Coffee with an old friend", type: "moment", xp: 5, n: 6, cat: "Connection" });
  t.memory = mem.map(m => ({ id: id(), ...u, name: m.name, type: m.type, xp: m.xp, date: nice(m.n), date_key: dk(m.n), inserted_at: iso(m.n, 10), cat: m.cat, tags: [] }));
  t.user_xp = [{ ...u, total_xp: t.memory.reduce((s, m) => s + m.xp, 0), updated_at: iso(1) }];

  // ── YOUrnal ──
  const entries = [
    [1, "good", "The river was high this morning and a heron stood completely still in the shallows. I stood still too, for longer than I meant to. Pages after, and they came easily for once.", ["river", "calm"]],
    [3, "okay", "Tired today. Skipped the stillness and didn't beat myself up about it, which feels like its own small win. Made soup, went to bed early.", ["rest"]],
    [5, "great", "Pottery class: the clay finally centred and stayed centred. The teacher said 'there it is' and I laughed out loud. I want to remember how my hands knew before I did.", ["pottery", "proud"]],
    [8, "low", "A heavy, grey sort of day. Work felt loud. The walk helped a little. Writing this down helps a little more.", ["tired"]],
    [10, "good", "Sketched the bridge from the bench by the boathouse. Not good, but mine. Started wondering about a little zine of river drawings.", ["drawing", "idea"]],
    [14, "okay", "First week of trying to do things slowly. Morning pages feel strange, like talking to someone who only listens. Keeping going.", ["beginning"]]
  ];
  t.journal_entries = entries.map(([n, mood, content, tags]) => ({
    id: id(), ...u, content, mood, entry_date: dk(n), created_at: iso(n, 20), updated_at: iso(n, 20), tags
  }));
  t.journal_highlights = [{
    id: id(), ...u, entry_id: t.journal_entries[2].id, entry_date: dk(5),
    text: "I want to remember how my hands knew before I did.", tags: [], item_id: pottery, as_memento: true, created_at: iso(5, 21)
  }];

  // How each day felt (today is left for the visitor to answer).
  const moods = [[1, "good"], [2, "good"], [3, "okay"], [4, "okay"], [5, "great"], [6, "good"], [7, "okay"], [8, "low"], [9, "okay"], [10, "good"], [12, "okay"], [13, "good"]];
  t.mood_log = moods.map(([n, mood]) => ({ id: id(), ...u, mood, energy: null, date: nice(n), date_key: dk(n), inserted_at: iso(n, 8) }));

  // ── YOU: values and compass ──
  const value = (name, definition, rating) => ({
    id: id(), ...u, name, rating, completed: [], prestige: 0, status: "active", definition,
    definition_history: [], highest_tier_reached: 0, inserted_at: iso(22), updated_at: iso(6)
  });
  t.user_values = [
    value("Creativity", "Making something with my hands, even when it comes out lopsided.", 3),
    value("Curiosity", "Following the small question instead of the sensible one.", 2),
    value("Rest", "Stopping before I'm empty, not after.", 2),
    value("Gratitude", "Noticing the heron.", 1)
  ];
  t.value_compass = [{
    // Tiers, most important first; values in one tier are held equal.
    id: id(), ...u, ordering: [["Creativity"], ["Rest", "Curiosity"], ["Gratitude"]], hardest: null, crossings: 3,
    compass_line: "Make things slowly, rest without guilt, stay curious.", created_at: iso(12), updated_at: iso(12)
  }];

  // ── YOUrney: moments, a chapter, who they're becoming ──
  t.life_moments = [
    { id: id(), ...u, title: "Moved into the flat by the river", description: "Boxes everywhere and the sound of water at night.", moment_date: dk(600), photo_path: null, photo_paths: [], inserted_at: iso(25) },
    { id: id(), ...u, title: "First pottery class", description: "Everything I made collapsed. I booked the whole term anyway.", moment_date: dk(19), photo_path: null, photo_paths: [], inserted_at: iso(19) },
    { id: id(), ...u, title: "Coffee with an old friend", description: "Three hours that felt like twenty minutes.", moment_date: dk(6), photo_path: null, photo_paths: [], inserted_at: iso(6) }
  ];
  t.life_chapters = [
    { id: id(), ...u, title: "The river years", range_start: dk(600), range_end: null, blurb: "A quieter life, chosen on purpose.", inserted_at: iso(25) }
  ];
  t.identity_visions = [{
    id: id(), ...u, category: "Play", title: "A maker who finishes things",
    statement: "I make things with my hands and I let them be finished, even when they aren't perfect.",
    reflection: "", vision_date: dk(9), inserted_at: iso(9), updated_at: iso(9), journey: {}, item_ids: [pottery, market]
  }];

  // ── A couple of focus sessions ──
  t.focus_sessions = [
    { id: id(), ...u, item_id: zine, intention_id: null, label: "Sketching the bridge", pillar: "Play", value_name: "Creativity", planned_minutes: 25, minutes: 25, outcome: "done", note: "", xp: 10, started_at: iso(10, 15), ended_at: iso(10, 15), date_key: dk(10), mementos: [] },
    { id: id(), ...u, item_id: still, intention_id: null, label: "Stillness", pillar: "Spirit", value_name: "Rest", planned_minutes: 10, minutes: 12, outcome: "done", note: "", xp: 5, started_at: iso(2, 21), ended_at: iso(2, 21), date_key: dk(2), mementos: [] }
  ];

  return db;
}
