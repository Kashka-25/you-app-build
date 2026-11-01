import { scoreOf, bandFor } from "./mood";
import { dailySteps, formatAmount } from "./habits";

// The numbers of a season, worked out on the device from what's already
// loaded (no AI): what was written, felt, done and grown between `from`
// and `to` (dates, YYYY-MM-DD; `to` not included).
export function seasonStats({ journalEntries, moments, moodLog, memory, habitLogs, focusSessions, items }, from, to) {
  const inside = d => d && d >= from && d < to;

  const entries = journalEntries.filter(e => inside(e.entry_date));
  const memories = moments.filter(m => inside(m.moment_date));
  const moods = moodLog.filter(m => inside(m.date_key)).map(scoreOf).filter(v => v != null);
  const moodAvg = moods.length ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length) : null;

  const xpRows = memory.filter(m => inside(m.date_key) && m.xp > 0);
  const xp = xpRows.reduce((sum, m) => sum + m.xp, 0);
  const byPillar = {};
  xpRows.forEach(m => { if (m.cat) byPillar[m.cat] = (byPillar[m.cat] || 0) + m.xp; });
  const topPillar = Object.entries(byPillar).sort((a, b) => b[1] - a[1])[0] || null;

  // Days a habit was done: step ticks and check-ins.
  const habitDayKeys = new Set();
  habitLogs.filter(l => inside(l.day)).forEach(l => habitDayKeys.add(`${l.item_id}|${l.day}`));
  memory.filter(m => inside(m.date_key) && m.xp > 0 && /\(check-in #/.test(m.name || "")).forEach(m => habitDayKeys.add(`${m.name.split(" (check-in")[0]}|${m.date_key}`));

  // The habit with the biggest running total this season ("2,400 push-ups").
  let bestTotal = null;
  for (const item of items.filter(i => i.type === "habit")) {
    const steps = dailySteps(item);
    for (const s of steps) {
      const amount = habitLogs
        .filter(l => l.item_id === item.id && l.step === s.key && inside(l.day))
        .reduce((sum, l) => sum + (l.amount != null ? Number(l.amount) : s.amount || 0), 0);
      if (amount > 0 && (!bestTotal || amount > bestTotal.amount)) {
        bestTotal = { amount, text: formatAmount(amount, s.unit || (s.key === "habit" ? "" : s.text.toLowerCase())), habit: item.name };
      }
    }
  }

  const completed = memory.filter(m => inside(m.date_key) && ["goal", "dream"].includes(m.type) && !/\(/.test(m.name || "")).map(m => m.name);
  const focusMinutes = focusSessions.filter(f => inside((f.ended_at || "").slice(0, 10))).reduce((sum, f) => sum + (f.minutes || 0), 0);

  const tagCount = {};
  entries.forEach(e => (e.tags || []).forEach(t => { const k = String(t).replace(/^#/, "").toLowerCase(); tagCount[k] = (tagCount[k] || 0) + 1; }));
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

  return {
    entries: entries.length,
    words: entries.reduce((n, e) => n + (e.content || "").split(/\s+/).filter(Boolean).length, 0),
    moments: memories.length,
    momentTitles: memories.slice(0, 4).map(m => m.title),
    moodCount: moods.length,
    moodAvg,
    moodWord: moodAvg != null ? bandFor(moodAvg).label : null,
    xp,
    topPillar: topPillar ? { name: topPillar[0], xp: topPillar[1] } : null,
    habitDays: habitDayKeys.size,
    bestTotal,
    completed,
    focusMinutes,
    topTags
  };
}
