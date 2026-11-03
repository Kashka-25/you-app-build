// Habits that start fresh each day (Cassidy, Oct 27): a habit's steps are
// ticked per day in habit_logs, each with what was actually done (150
// push-ups, an hour instead of 30 minutes). A habit with no steps is one
// step of its own, keyed "habit", with its optional daily amount.

// A step's key in habit_logs: its id, or (for steps made before ids) its
// words, so older steps keep working.
export const stepKey = step => step.id || `t:${step.text}`;

// What a habit asks of each day: its steps, or itself.
export function dailySteps(item) {
  const steps = (item.milestones || []).filter(s => s.text);
  if (steps.length) return steps.map(s => ({ key: stepKey(s), text: s.text, amount: num(s.amount), unit: s.unit || "" }));
  return [{ key: "habit", text: item.name, amount: num(item.dailyTarget?.amount), unit: item.dailyTarget?.unit || "" }];
}

const num = v => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));

export function newStepId() {
  return crypto.randomUUID ? crypto.randomUUID() : `s${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

// A unit that means time. Time is kept in minutes (Cassidy, Nov 3: "how
// much" in minutes or hours as well as a plain number), so totals add up.
export const isTimeUnit = unit => /^(min|mins|minute|minutes|hr|hrs|hour|hours)$/i.test(String(unit || "").trim());
const isHourUnit = unit => /^(hr|hrs|hour|hours)$/i.test(String(unit || "").trim());

// "100 push-ups", "1 h 30 min" style.
export function formatAmount(amount, unit) {
  if (amount == null) return "";
  const n = Number(amount);
  if (isTimeUnit(unit)) {
    const mins = Math.round(isHourUnit(unit) ? n * 60 : n);
    const h = Math.floor(mins / 60), m = mins % 60;
    return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
  }
  const shown = Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return unit ? `${shown} ${unit}` : shown;
}

function daysBetween(a, b) {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2 - d1) / 86400000);
}

// Days done, days since starting, and the running total of each amount.
export function habitStats(item, logs, today) {
  const mine = logs.filter(l => l.item_id === item.id);
  const days = new Set(mine.map(l => l.day));
  // From the earliest of: when it was started in YOU, or any history filled in before that.
  const start = [item.createdDate, ...days].filter(Boolean).sort()[0] || today;
  const since = Math.max(1, daysBetween(start, today) + 1);
  const steps = dailySteps(item);
  const totals = steps
    .map(s => {
      const amount = mine
        .filter(l => l.step === s.key)
        .reduce((sum, l) => sum + (l.amount != null ? Number(l.amount) : s.amount || 0), 0);
      return { key: s.key, text: s.text, unit: s.unit, amount };
    })
    .filter(t => t.amount > 0);
  // Each step on its own (Cassidy, Nov 3): the days it was ticked, and its
  // total, so a step that's slipping shows (push-ups 10 days, sit-ups 5).
  const perStep = steps.length > 1 || steps[0]?.key !== "habit"
    ? steps.map(s => {
        const logs = mine.filter(l => l.step === s.key);
        const amount = logs.reduce((sum, l) => sum + (l.amount != null ? Number(l.amount) : s.amount || 0), 0);
        return { key: s.key, text: s.text, unit: s.unit, days: new Set(logs.map(l => l.day)).size, amount };
      })
    : [];
  return { daysDone: days.size, since: Math.max(since, days.size), totals, perStep };
}

// Round numbers worth a small celebration.
const MARKS = [7, 21, 30, 50, 100, 150, 200, 250, 300, 365, 500, 730, 1000];
export function celebration(stats) {
  const mark = [...MARKS].reverse().find(m => stats.daysDone >= m);
  if (!mark) return null;
  const totals = stats.totals.map(t => formatAmount(t.amount, t.unit || t.text.toLowerCase())).filter(Boolean);
  const tail = totals.length ? ` That's ${joinWords(totals)}.` : "";
  return { mark, text: `Wow, ${stats.daysDone} days of this habit out of ${stats.since}.${tail}` };
}

function joinWords(list) {
  if (list.length < 2) return list[0] || "";
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}
