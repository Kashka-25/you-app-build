import { XP_VALS } from "../constants/app.const";

// YOU's habit XP, shown to the Seeker as encouragement and used by
// AppDataContext (toggleDay, toggleHabitStep) so the two never drift
// (Cassidy, Oct 28):
//   · a habit's daily check-in is 3 XP;
//   · every 7 days in a row adds a +5 bonus, and every 30 days in a row
//     another +10 (flat, not growing);
//   · a habit with steps splits its 3 XP between them, each tick earning
//     its share; the streak bonus comes with the day's check-in;
//   · finishing a pursuit is 10 (habit), 25 (goal) or 50 (dream).
export const CHECKIN_XP = 3;
export const WEEK_BONUS_XP = 5;
export const MONTH_BONUS_XP = 10;

export function streakBonus(daysInARow) {
  if (!daysInARow) return 0;
  return (daysInARow % 7 === 0 ? WEEK_BONUS_XP : 0) + (daysInARow % 30 === 0 ? MONTH_BONUS_XP : 0);
}

// What checking in today would earn, given the days in a row before today.
export function nextCheckinXp(streakBeforeToday) {
  return CHECKIN_XP + streakBonus((streakBeforeToday || 0) + 1);
}

// "3 more days to the +5 week bonus", or today's bonus.
export function bonusHint(streakBeforeToday) {
  const today = (streakBeforeToday || 0) + 1;
  const toWeek = (7 - (today % 7)) % 7;
  const toMonth = (30 - (today % 30)) % 30;
  const bonusToday = streakBonus(today);
  if (bonusToday) return `Today brings a +${bonusToday} streak bonus`;
  if (toMonth < toWeek) return `${toMonth + 1} more ${toMonth === 0 ? "day" : "days"} to the +${MONTH_BONUS_XP} month bonus`;
  return `${toWeek + 1} more ${toWeek === 0 ? "day" : "days"} to the +${WEEK_BONUS_XP} week bonus`;
}

// The 3 XP shared between n steps, as whole numbers that add up to 3
// (memory.xp is an integer): 3 steps → 1 each, 2 → 2 and 1, 4 → 1, 1, 1, 0.
export function stepShares(n, total = CHECKIN_XP) {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const extra = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

export const finishXp = item => XP_VALS[item.type] || 10;

// Which days a habit was done: its check-ins and step shares that still
// carry XP, and its daily step ticks.
export function habitDays(item, memory, habitLogs) {
  const days = new Set();
  const checkin = `${item.name} (check-in #`;
  const step = `${item.name} (step `;
  for (const m of memory) {
    if (m.xp > 0 && m.date_key && (m.name?.startsWith(checkin) || m.name?.startsWith(step))) days.add(m.date_key);
  }
  for (const l of habitLogs) if (l.item_id === item.id) days.add(l.day);
  return days;
}

function prevDay(key) {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Days in a row ending on `day` (counted only if `day` itself is done).
export function streakEnding(days, day) {
  let n = 0;
  let k = day;
  while (days.has(k)) { n++; k = prevDay(k); }
  return n;
}

// The streak before today: days in a row ending yesterday.
export const streakBefore = (days, today) => streakEnding(days, prevDay(today));
