// Week helpers for Sow · Tend · Harvest. Everything here is the Seeker's
// LOCAL date — not toISOString(), which is UTC and reads as yesterday in an
// Australian morning. Weeks run Monday → Sunday.

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 0 = Monday … 6 = Sunday
export function weekdayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

// Monday of the week `date` sits in.
export function weekStartKey(date = new Date()) {
  return localDateKey(addDays(date, -weekdayIndex(date)));
}

// The week Sow plans for: on Sunday it's next week (Sunday evening is the
// sowing ritual), any other day it's the week already underway.
export function sowWeekStartKey(date = new Date()) {
  return weekdayIndex(date) === 6 ? localDateKey(addDays(date, 1)) : weekStartKey(date);
}

export function isSunday(date = new Date()) {
  return weekdayIndex(date) === 6;
}

export function weekRangeLabel(weekStart) {
  const start = new Date(weekStart + "T00:00:00");
  const end = addDays(start, 6);
  const fmt = d => d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

// Does this sown intention belong on today's list? Specific days show on
// those days; "sometime this week" shows every day until tended once.
// Rested-today ones step aside until tomorrow.
export function isDueToday(intention, date = new Date()) {
  const today = localDateKey(date);
  if (intention.week_start !== weekStartKey(date)) return false;
  if ((intention.rested_dates || []).includes(today)) return false;
  const days = intention.days || [];
  if (days.length === 0) {
    const tended = intention.tended_dates || [];
    return tended.length === 0 || tended.includes(today);
  }
  return days.includes(weekdayIndex(date));
}

// "Tended on N days this week" — distinct days anything was tended.
// Counts what happened; never shows what didn't.
export function tendedDaysThisWeek(intentions, date = new Date()) {
  const week = weekStartKey(date);
  const days = new Set();
  intentions.filter(i => i.week_start === week).forEach(i => (i.tended_dates || []).forEach(d => days.add(d)));
  return days.size;
}

// Choosing to sow nothing is a real choice — remembered per device so the
// gentle "sow your week" prompt doesn't keep asking that week.
const restedKey = weekStart => `you.sow.rested.${weekStart}`;
export function markWeekRested(weekStart, rested) {
  try {
    if (rested) localStorage.setItem(restedKey(weekStart), "1");
    else localStorage.removeItem(restedKey(weekStart));
  } catch { /* storage unavailable — the prompt just shows again */ }
}
export function isWeekRested(weekStart) {
  try { return localStorage.getItem(restedKey(weekStart)) === "1"; } catch { return false; }
}

// "Open on the Threshold" — per device for now (default on).
const THRESHOLD_PREF = "you.threshold.onOpen";
export function thresholdOnOpen() {
  try { return localStorage.getItem(THRESHOLD_PREF) !== "off"; } catch { return true; }
}
export function setThresholdOnOpen(on) {
  try { localStorage.setItem(THRESHOLD_PREF, on ? "on" : "off"); } catch { /* ignore */ }
}

// Go back if there's somewhere to go back to in this app, else Home.
export function goBack(navigate) {
  if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
  else navigate("/");
}

// Whether to gently offer Sow: the week Sow would plan has nothing sown and
// wasn't deliberately rested. On Sunday that's next week.
export function needsSowing(intentions, date = new Date()) {
  const week = sowWeekStartKey(date);
  return !intentions.some(i => i.week_start === week) && !isWeekRested(week);
}

// A date key `n` days from another (pure calendar maths, local dates).
export function addDaysKey(dateKey, n) {
  return localDateKey(addDays(new Date(dateKey + "T00:00:00"), n));
}

// The week Harvest looks back on: on Sunday it's the week now ending; any
// other day it's last week (a missed Sunday doesn't mean a missed harvest).
export function harvestWeekStartKey(date = new Date()) {
  return isSunday(date) ? weekStartKey(date) : addDaysKey(weekStartKey(date), -7);
}

// Offer Harvest only when that week had something sown and hasn't been
// harvested yet. After its window passes, it quietly stops asking.
export function harvestDue(intentions, harvests, date = new Date()) {
  const week = harvestWeekStartKey(date);
  const sown = intentions.some(i => i.week_start === week);
  const done = harvests.some(h => h.week_start === week);
  return sown && !done ? week : null;
}
