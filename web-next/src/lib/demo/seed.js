// What the demo starts with (lib/demo/mode.js). "example" is Wren, a
// made-up Seeker six weeks into YOU; "blank" is a new Seeker who hasn't
// been welcomed yet. Every name, place and line here is invented and isn't
// about Cassidy or anyone real.
//
// Wren's history is built, not hand-typed: a fixed-seed generator decides
// which days each habit was kept, so the example is the same for every
// visitor and after every Reset, with dates counted back from today. Every
// number is made by YOU's own rules (lib/xp.js, lib/focus.js, the value
// challenges), so XP, streaks, Pillar levels, the rank and the week rings
// all agree with each other. Nothing here imitates AI: no reflections,
// seasons or insights are written for Wren; those stay switched off.
import { CHECKIN_XP, streakBonus } from "../xp";
import { markerXp } from "../focus";
import { localDateKey, weekStartKey, sowWeekStartKey, harvestWeekStartKey, addDaysKey } from "../week";
import { VALUE_PILLAR, VALUE_PILLAR2, cycleTierIndex } from "../../constants/app.const";
import { ALL_VALUES_LIB } from "../../constants/values.const";

const DAYS = 41; // Wren began six weeks ago

// ── reproducible randomness ──
function generator(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const at = (n, hour = 9, minute = 0) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hour, minute, 0, 0); return d; };
const dk = n => localDateKey(at(n, 12));
const iso = (n, hour, minute) => at(n, hour, minute).toISOString();
const nice = key => new Date(key + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
const ago = key => Math.round((at(0, 12) - new Date(key + "T12:00:00")) / 86400000);
const slotOfKey = key => (new Date(key + "T12:00:00").getDay() + 6) % 7; // Monday = 0

let seq = 0;
const id = () => {
  seq += 1;
  const n = String(seq).padStart(4, "0");
  return `d3e0${n}0-0000-4000-8000-${String(seq).padStart(12, "0")}`;
};

export function buildDemoDatabase(kind, userId) {
  seq = 0;
  const base = { tables: {}, serial: 1000 };
  if (kind === "blank") {
    // The welcome and first steps, exactly as a new Seeker sees them.
    base.user = { id: userId, email: "demo@example.invalid", user_metadata: { prefs: { simple_v1: true, plugins: {}, nav: {} } } };
    base.tables.profiles = [{ id: id(), user_id: userId, name: null, inserted_at: iso(0, 9), updated_at: iso(0, 9) }];
    return base;
  }
  return exampleDatabase(base, userId);
}

function exampleDatabase(db, userId) {
  const rand = generator(20261109);
  const u = { user_id: userId };
  const t = db.tables;
  const today = dk(0);
  const thisWeek = weekStartKey();
  const memory = [];
  const remember = (name, type, xp, key, cat, hour = 10) =>
    memory.push({ id: id(), ...u, name, type, xp, date: nice(key), date_key: key, inserted_at: iso(ago(key), hour), cat, tags: [] });

  db.user = {
    id: userId,
    email: "demo@example.invalid",
    // Focus and the to-do list are switched on, so their pages have something to show.
    user_metadata: { prefs: { welcomed: true, simple_v1: true, plugins: { focus: true, todo_list: true }, nav: {} } }
  };

  t.profiles = [{
    id: id(), ...u, name: "Wren", bio: "Learning to make things slowly. Pottery on Thursdays, river walks most mornings.",
    location: "A small town by a river", inserted_at: iso(DAYS, 8), updated_at: iso(3, 20)
  }];

  // ── Habits: which days each was kept ──
  const blank7 = () => [false, false, false, false, false, false, false];
  const habitDefs = [
    { name: "Walk by the river", cat: "Body", start: 41, chance: 0.8, hour: 7, intention: "Fresh air before the screen goes on." },
    { name: "Morning pages", cat: "Mind", start: 41, chance: 0.72, hour: 6, intention: "Three pages, no rereading." },
    { name: "Ten minutes of stillness", cat: "Spirit", start: 30, chance: 0.55, hour: 21, intention: "Sit, breathe, notice.", target: { amount: 10, unit: "minutes" } },
    { name: "Message someone I love", cat: "Connection", start: 20, chance: 0.4, hour: 19, intention: "A line is enough." }
  ];
  t.items = [];
  t.habit_logs = [];
  for (const h of habitDefs) {
    const hid = id();
    const kept = [];
    for (let n = h.start; n >= 1; n--) if (rand() < h.chance) kept.push(dk(n)); // today is left for the visitor
    // Days in a row, and the XP each check-in earned by YOU's rule.
    let run = 0, prev = null;
    const days = blank7();
    for (const key of kept) {
      run = prev && addDaysKey(prev, 1) === key ? run + 1 : 1;
      prev = key;
      const inThisWeek = key >= thisWeek;
      if (inThisWeek) days[slotOfKey(key)] = true;
      // This week's check-ins carry the slot name the check-in lock uses;
      // earlier weeks are named by their date so they can't block a slot.
      const name = inThisWeek ? `${h.name} (check-in #${slotOfKey(key)} cycle 0)` : `${h.name} (check-in #${slotOfKey(key)} of ${key})`;
      remember(name, "habit", CHECKIN_XP + streakBonus(run), key, h.cat, h.hour);
      const amount = h.target ? 8 + Math.floor(rand() * 9) : null;
      t.habit_logs.push({ id: id(), ...u, item_id: hid, day: key, step: "habit", amount, created_at: iso(ago(key), h.hour), updated_at: iso(ago(key), h.hour) });
    }
    t.items.push({
      id: hid, ...u, name: h.name, type: "habit", cat: h.cat, subcat: "", note: "", tags: [], intention: h.intention,
      milestones: [], daily_target: h.target || null, done: false, streak: days.filter(Boolean).length, days,
      last_checkin: kept.length ? kept[kept.length - 1] : null,
      created: nice(dk(h.start)), created_date: dk(h.start), inserted_at: iso(h.start, 8)
    });
  }
  const [walk, pages, still] = t.items;

  // ── Goals, dreams and ideas ──
  const pursuit = (name, type, cat, startedAgo, extra = {}) => {
    const row = {
      id: id(), ...u, name, type, cat, subcat: "", note: extra.note || "", tags: [], intention: extra.intention || "",
      daily_target: null, done: Boolean(extra.doneAgo), streak: 0, days: blank7(), last_checkin: null,
      milestones: (extra.steps || []).map(([text, done]) => ({ id: id(), text, done })),
      created: nice(dk(startedAgo)), created_date: dk(startedAgo), inserted_at: iso(startedAgo, 12)
    };
    t.items.push(row);
    if (extra.doneAgo) remember(name, type, type === "dream" ? 50 : 25, dk(extra.doneAgo), cat, 18);
    return row;
  };
  const pottery = pursuit("Finish the beginner pottery course", "goal", "Play", 38, {
    note: "Thursday evenings at the community studio.",
    steps: [["Book the class", true], ["Centre the clay without it wobbling", true], ["Make a bowl that holds water", true], ["Glaze three pieces", false], ["Bring one home for the table", false]]
  });
  const train = pursuit("Save for a slow trip by train", "goal", "Purpose", 33, {
    note: "Coast to mountains, no flights.",
    steps: [["Pick the route", true], ["Open a separate savings pot", true], ["Put a little aside every payday", false], ["Book the first leg", false]]
  });
  const market = pursuit("Sell a few pieces at a weekend market", "dream", "Purpose", 30, { note: "One table, one morning. That would be enough." });
  pursuit("Live somewhere with a garden", "dream", "Home & Earth", 26, { note: "Tomatoes, a bench, a door that opens onto green." });
  const zine = pursuit("A little zine of river sketches", "idea", "Play", 17);
  pursuit("A soup swap with the neighbours", "idea", "Connection", 6, { note: "Everyone brings a pot, everyone leaves with a jar." });
  const herbs = pursuit("Plant a herb box on the balcony", "goal", "Home & Earth", 39, { doneAgo: 27, steps: [["Buy a box and soil", true], ["Basil, thyme, mint", true]] });
  pursuit("Read one novel cover to cover", "goal", "Mind", 35, { doneAgo: 9, note: "The first in two years." });
  pursuit("Write Gran a proper letter", "goal", "Heart", 24, { doneAgo: 18, note: "Four pages. Posted it before I could reread it." });

  // ── Sow and harvest: the last five weeks ──
  const sowWeek = sowWeekStartKey();
  const unharvested = harvestWeekStartKey(); // left for the visitor to try Harvest
  const weeks = [4, 3, 2, 1, 0].map(w => addDaysKey(thisWeek, -7 * w)).filter(w => w >= dk(DAYS));
  const sowings = [
    { pick: [herbs, pottery], harvest: "Herbs are in and already trying to escape the box. Clay was a mess, a happy one." },
    { pick: [pottery, train], harvest: "Opened the savings pot. Small, but it exists now." },
    { pick: [pottery, market, train], harvest: "Too much sown. Next week, fewer things, done gently." },
    { pick: [pottery, zine], harvest: "The bowl held water! Sketched twice by the boathouse." },
    { pick: [pottery, train, zine], harvest: null }
  ];
  t.week_intentions = [];
  t.week_harvests = [];
  weeks.forEach((week, i) => {
    const plan = sowings[sowings.length - weeks.length + i];
    for (const item of plan.pick) {
      const days = [0, 1, 2, 3, 4, 5, 6].filter(() => rand() < 0.45).slice(0, 3);
      if (!days.length) days.push(3);
      const tended = days.map(d => addDaysKey(week, d)).filter(key => key < today && rand() < 0.75);
      for (const key of tended) remember(`Tended: ${item.name}`, item.type, 3, key, item.cat, 17);
      const past = week < thisWeek;
      // Carried only if it really was sown again the next week; otherwise it rested.
      const next = sowings[sowings.length - weeks.length + i + 1];
      const outcome = past && week !== unharvested ? (next?.pick.includes(item) ? "carried" : "rested") : null;
      t.week_intentions.push({
        id: id(), ...u, item_id: item.id, week_start: week, days, value_name: null, tended_dates: tended, rested_dates: [],
        outcome, inserted_at: iso(ago(week) + 1, 19)
      });
    }
    if (week < thisWeek && week !== unharvested && plan.harvest) {
      t.week_harvests.push({ id: id(), ...u, week_start: week, note: plan.harvest, created_at: iso(ago(week) - 6, 20), updated_at: iso(ago(week) - 6, 20) });
    }
  });
  // If the week to sow is next week (on a Sunday), it's still open: Sow is the visitor's to try.
  void sowWeek;

  // ── Focus sessions ──
  const sessions = [
    [36, "Wedging clay", pottery, "Play", 25], [31, "Route planning", train, "Purpose", 30], [27, "Stillness", still, "Spirit", 15],
    [22, "Sketching the bridge", zine, "Play", 45], [16, "Morning pages, longer", pages, "Mind", 20], [12, "Trimming bowls", pottery, "Play", 60],
    [8, "Sketching the boathouse", zine, "Play", 35], [4, "Stillness", still, "Spirit", 12], [2, "Glaze tests", pottery, "Play", 40]
  ];
  t.focus_sessions = sessions.map(([n, label, item, pillar, minutes]) => {
    const xp = markerXp(minutes);
    const key = dk(n);
    remember(`Focus: ${label}`, "focus", xp, key, pillar, 16);
    return {
      id: id(), ...u, item_id: item.id, intention_id: null, label, pillar, value_name: null, planned_minutes: minutes, minutes,
      outcome: "bloom", note: "", xp, started_at: iso(n, 15), ended_at: iso(n, 15, Math.min(59, minutes)), date_key: key, mementos: []
    };
  });

  // ── Values, from the real challenge library ──
  const library = name => ALL_VALUES_LIB.find(v => v.name === name)?.challenges || [];
  const valueDefs = [
    ["Creativity", "Making something with my hands, even when it comes out lopsided.", [[0, 33], [2, 20], [3, 5]]],
    ["Rest", "Stopping before I'm empty, not after.", [[1, 24], [2, 11]]],
    ["Curiosity", "Following the small question instead of the sensible one.", [[1, 29], [0, 14]]],
    ["Gratitude", "Noticing the heron.", [[0, 19], [2, 3]]]
  ];
  t.user_values = valueDefs.map(([name, definition, done]) => {
    let rating = 0;
    for (const [idx, n] of done) {
      const c = library(name)[idx];
      if (!c) continue;
      rating += c.pts;
      const label = `${name} challenge: ${c.text.slice(0, 30)}`;
      remember(label, "habit", c.pts, dk(n), VALUE_PILLAR[name] || "Spirit", 20);
      if (VALUE_PILLAR2[name]) remember(`${label} (pillar 2)`, "habit", Math.floor(c.pts / 2), dk(n), VALUE_PILLAR2[name], 20);
    }
    return {
      id: id(), ...u, name, rating, completed: done.map(([idx]) => idx), prestige: 0, status: "active", definition,
      definition_history: [], highest_tier_reached: cycleTierIndex(rating, 0), inserted_at: iso(37, 21), updated_at: iso(done[done.length - 1][1], 20)
    };
  });
  t.value_compass = [{
    // Tiers, most important first; values in one tier are held equal.
    id: id(), ...u, ordering: [["Creativity"], ["Rest", "Curiosity"], ["Gratitude"]], hardest: "Rest or Curiosity", crossings: 6,
    compass_line: "Make things slowly, rest without guilt, stay curious.", created_at: iso(23, 21), updated_at: iso(23, 21)
  }];

  // ── YOUrnal: six weeks of entries, and the day's mood with each ──
  const entries = [
    [40, "okay", "Day one of trying to do things slowly. Wrote three pages of nothing much and walked to the bridge and back. That's the whole plan for now.", ["beginning"]],
    [38, "good", "Booked the pottery course. Eight Thursdays. I keep looking at the confirmation email like it might change its mind.", ["pottery"]],
    [36, "low", "First class. Everything I made collapsed into a sort of grey pancake. Mo, the teacher, said that's exactly right for week one. I didn't believe her but I laughed.", ["pottery", "tired"]],
    [33, "good", "Opened a savings pot called 'Slow train'. Put in less than a coffee. It still felt like a promise.", ["travel", "money"]],
    [31, "okay", "Rain all day. Did the stillness in the kitchen with the kettle ticking. Ten minutes is longer than it sounds.", ["rest", "stillness"]],
    [28, "great", "Basil, thyme and mint are in the balcony box. Juno came round and named the mint 'the escape artist'. Laughed until my face hurt.", ["home", "friends"]],
    [25, "okay", "Skipped the walk. Didn't punish myself for it, which might be the actual practice.", ["rest"]],
    [22, "good", "Sketched the bridge from the bench by the boathouse. Not good, but mine. Started wondering about a little zine of river drawings.", ["drawing", "idea"]],
    [19, "low", "Sowed too much this week and felt behind by Tuesday. Wrote a note to Sunday-me: fewer things, done gently.", ["sowing"]],
    [17, "good", "Tess called from the coast. We talked about the train trip like it was already booked. Maybe it nearly is.", ["family", "travel"]],
    [14, "great", "The bowl held water. A whole bowl. I carried it round the studio like a cup of something precious, which I suppose it was.", ["pottery", "proud"]],
    [12, "okay", "Long session trimming. My hands knew what to do before I did, for about four minutes. I want more of those minutes.", ["pottery"]],
    [9, "good", "Finished the novel. First book cover to cover in two years. Sat with the last page for a while.", ["reading"]],
    [7, "okay", "A heavy, grey sort of week. Work felt loud. The walks helped a little. Writing this helps a little more.", ["tired"]],
    [5, "great", "Glaze tests came out of the kiln. One blue I didn't expect at all. I keep picking it up.", ["pottery", "colour"]],
    [3, "okay", "Tired today. Skipped the stillness and made soup instead. Went to bed early without the phone.", ["rest"]],
    [1, "good", "The river was high this morning and a heron stood completely still in the shallows. I stood still too, for longer than I meant to.", ["river", "calm"]]
  ];
  t.journal_entries = entries.map(([n, mood, content, tags]) => ({
    id: id(), ...u, content, mood, entry_date: dk(n), created_at: iso(n, 21), updated_at: iso(n, 21), tags, mood_score: null
  }));
  const entryOn = n => t.journal_entries.find(e => e.entry_date === dk(n));
  t.journal_highlights = [
    [14, "I carried it round the studio like a cup of something precious.", pottery, true],
    [12, "My hands knew what to do before I did.", pottery, true],
    [25, "Didn't punish myself for it, which might be the actual practice.", null, true],
    [1, "I stood still too, for longer than I meant to.", walk, false]
  ].map(([n, text, item, memento]) => ({
    id: id(), ...u, entry_id: entryOn(n).id, entry_date: dk(n), text, tags: [], item_id: item?.id || null, as_memento: memento, created_at: iso(n, 21, 30)
  }));

  // How each day felt: the entry's mood on journal days, a quick check-in on most others.
  const moodByDay = Object.fromEntries(entries.map(([n, mood]) => [n, mood]));
  const quick = ["okay", "good", "okay", "good", "great", "low", "okay"];
  t.mood_log = [];
  for (let n = DAYS; n >= 1; n--) {
    const mood = moodByDay[n] || (rand() < 0.7 ? quick[Math.floor(rand() * quick.length)] : null);
    if (mood) t.mood_log.push({ id: id(), ...u, mood, energy: null, date: nice(dk(n)), date_key: dk(n), inserted_at: iso(n, 8), score: null });
  }

  // ── YOUrney: moments across a life, its chapters, who Wren is becoming ──
  const year = new Date().getFullYear();
  const moment = (title, description, date) => ({ id: id(), ...u, title, description, moment_date: date, photo_path: null, photo_paths: [], stop_id: null, inserted_at: iso(DAYS - 1, 20) });
  t.life_moments = [
    moment("Learned to swim in the lake", "Gran held the back of my swimsuit and then, at some point, didn't.", `${year - 24}-07-12`),
    moment("Moved to the city", "One suitcase, a plant, and a job I'd been talked into.", `${year - 9}-02-03`),
    moment("Moved into the flat by the river", "Boxes everywhere and the sound of water at night.", `${year - 2}-03-14`),
    moment("First pottery class", "Everything I made collapsed. I booked the whole term anyway.", dk(36)),
    moment("Juno named the mint", "'The escape artist.' It has lived up to it.", dk(28)),
    moment("The bowl that held water", "Small, wonky, mine.", dk(14))
  ];
  t.life_chapters = [
    { id: id(), ...u, title: "The lake summers", range_start: `${year - 26}-01-01`, range_end: `${year - 10}-12-31`, blurb: "Growing up near water, with a grandmother who believed in getting your feet wet.", inserted_at: iso(DAYS - 1, 20) },
    { id: id(), ...u, title: "The city years", range_start: `${year - 9}-02-01`, range_end: `${year - 2}-03-01`, blurb: "Fast, loud, and good at teaching me what I didn't want.", inserted_at: iso(DAYS - 1, 20) },
    { id: id(), ...u, title: "The river years", range_start: `${year - 2}-03-14`, range_end: null, blurb: "A quieter life, chosen on purpose.", inserted_at: iso(DAYS - 1, 20) }
  ];
  t.identity_visions = [
    {
      id: id(), ...u, category: "Play", title: "A maker who finishes things",
      statement: "I make things with my hands and I let them be finished, even when they aren't perfect.",
      reflection: "The bowl that held water was the first proof.", vision_date: dk(20), inserted_at: iso(20, 21), updated_at: iso(14, 21), journey: {}, item_ids: [pottery.id, market.id]
    },
    {
      id: id(), ...u, category: "Spirit", title: "Someone who stops before they're empty",
      statement: "I rest as part of the work, not as a reward for it.",
      reflection: "", vision_date: dk(11), inserted_at: iso(11, 21), updated_at: iso(11, 21), journey: {}, item_ids: [still.id]
    }
  ];

  // ── Today's short list (the to-do extra) ──
  t.todos = [
    { id: id(), ...u, text: "Pick up glaze test tiles", todo_date: today, done: false, inserted_at: iso(0, 8), steps: [] },
    { id: id(), ...u, text: "Water the herb box", todo_date: today, done: true, inserted_at: iso(0, 8), steps: [] },
    { id: id(), ...u, text: "Message Tess about train dates", todo_date: today, done: false, inserted_at: iso(0, 8), steps: [] }
  ];

  t.memory = memory;
  t.user_xp = [{ ...u, total_xp: memory.reduce((s, m) => s + m.xp, 0), updated_at: iso(1, 21) }];
  return db;
}
