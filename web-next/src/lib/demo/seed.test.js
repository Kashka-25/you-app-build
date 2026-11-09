import { describe, expect, it } from "vitest";
import { buildDemoDatabase } from "./seed";
import { LEVELS, PILLARS, getPillarLevel } from "../../constants/app.const";
import { CHECKIN_XP, streakBonus } from "../xp";
import { localDateKey, addDaysKey, weekStartKey } from "../week";

// Wren's history must hang together: the same every time, every number made
// by YOU's own rules, and nothing that would trip the app's own checks.
const db = buildDemoDatabase("example", "demo-user");
const t = db.tables;
const today = localDateKey();

describe("Wren, the demo's example person", () => {
  it("is the same for every visitor and after every reset", () => {
    expect(JSON.stringify(buildDemoDatabase("example", "demo-user"))).toBe(JSON.stringify(db));
  });

  it("has a populated universe across YOU's real features", () => {
    for (const table of ["items", "habit_logs", "memory", "journal_entries", "journal_highlights", "mood_log", "user_values", "value_compass",
      "life_moments", "life_chapters", "identity_visions", "week_intentions", "week_harvests", "focus_sessions", "todos", "profiles"]) {
      expect(t[table]?.length, table).toBeGreaterThan(0);
    }
    expect(t.journal_entries.length).toBeGreaterThanOrEqual(15);
    expect(new Set(t.items.map(i => i.type))).toEqual(new Set(["habit", "goal", "dream", "idea"]));
  });

  it("writes nothing that only AI would write", () => {
    for (const table of ["journal_ai_insights", "weekly_reflections", "younderstandings", "seasons", "dream_patterns", "value_challenges"]) {
      expect(t[table], table).toBeUndefined();
    }
  });

  it("leaves today for the visitor: no check-ins, mood or entry yet", () => {
    expect(t.habit_logs.some(l => l.day === today)).toBe(false);
    expect(t.mood_log.some(m => m.date_key === today)).toBe(false);
    expect(t.journal_entries.some(e => e.entry_date === today)).toBe(false);
    expect(t.memory.some(m => m.date_key === today)).toBe(false);
  });

  it("gives each habit check-in exactly the XP YOU's rule gives", () => {
    for (const habit of t.items.filter(i => i.type === "habit")) {
      const days = t.habit_logs.filter(l => l.item_id === habit.id).map(l => l.day).sort();
      const xp = t.memory.filter(m => m.name.startsWith(`${habit.name} (check-in #`));
      expect(xp).toHaveLength(days.length);
      let run = 0;
      days.forEach((day, i) => {
        run = i && addDaysKey(days[i - 1], 1) === day ? run + 1 : 1;
        expect(xp.find(m => m.date_key === day)?.xp).toBe(CHECKIN_XP + streakBonus(run));
      });
      // The week ring shows exactly this week's check-ins.
      const thisWeek = days.filter(d => d >= weekStartKey()).length;
      expect(habit.days.filter(Boolean).length).toBe(thisWeek);
    }
  });

  it("never blocks today's check-in with an earlier week's slot name", () => {
    const slotNames = t.memory.filter(m => / cycle 0\)$/.test(m.name));
    expect(slotNames.every(m => m.date_key >= weekStartKey())).toBe(true);
    expect(new Set(slotNames.map(m => m.name)).size).toBe(slotNames.length);
  });

  it("adds up to a rank and Pillar levels that agree", () => {
    const total = t.memory.reduce((s, m) => s + m.xp, 0);
    expect(t.user_xp[0].total_xp).toBe(total);
    const rank = [...LEVELS].reverse().find(l => total >= l.xp);
    expect(["Wanderer", "Seeker"]).toContain(rank.name);
    const grown = PILLARS.filter(p => getPillarLevel(t.memory.filter(m => m.cat === p).reduce((s, m) => s + m.xp, 0)).level > 0);
    expect(grown.length).toBeGreaterThanOrEqual(2);
    expect(t.memory.every(m => PILLARS.includes(m.cat))).toBe(true);
  });

  it("uses the app's own words for outcomes", () => {
    expect(t.focus_sessions.every(f => f.outcome === "bloom")).toBe(true); // reached their planned time
    expect(t.week_intentions.every(w => [null, "carried", "rested", "released"].includes(w.outcome))).toBe(true);
    const moods = ["rough", "low", "okay", "good", "great"];
    expect(t.journal_entries.every(e => moods.includes(e.mood)) && t.mood_log.every(m => moods.includes(m.mood))).toBe(true);
  });

  it("links every row to things that exist", () => {
    const ids = new Set(t.items.map(i => i.id));
    expect(t.habit_logs.every(l => ids.has(l.item_id))).toBe(true);
    expect(t.week_intentions.every(w => ids.has(w.item_id))).toBe(true);
    expect(t.focus_sessions.every(f => ids.has(f.item_id))).toBe(true);
    expect(t.identity_visions.every(v => v.item_ids.every(i => ids.has(i)))).toBe(true);
    const entries = new Set(t.journal_entries.map(e => e.id));
    expect(t.journal_highlights.every(h => entries.has(h.entry_id))).toBe(true);
    expect(t.life_moments.every(m => !m.photo_path && m.photo_paths.length === 0)).toBe(true); // no broken images
  });

  it("starts blank with no pursuits or entries", () => {
    const blank = buildDemoDatabase("blank", "demo-user");
    expect(blank.tables.items).toBeUndefined();
    expect(blank.tables.journal_entries).toBeUndefined();
    expect(blank.user.user_metadata.prefs.welcomed).toBeUndefined();
  });

  it("prints its shape", () => {
    const total = t.memory.reduce((s, m) => s + m.xp, 0);
    const pillars = PILLARS.map(p => `${p} ${t.memory.filter(m => m.cat === p).reduce((s, m) => s + m.xp, 0)}`).join(", ");
    console.log(`Wren: ${total} XP; ${pillars}; ` + Object.entries(t).map(([k, v]) => `${k} ${v.length}`).join(", "));
  });
});
