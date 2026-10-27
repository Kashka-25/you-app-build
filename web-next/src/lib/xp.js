import { XP_VALS, STREAK_BONUS_INTERVAL, STREAK_BONUS_XP } from "../constants/app.const";

// What YOU's XP rewards are, shown to the Seeker as encouragement (Cassidy,
// Oct 28). Kept beside the rules in AppDataContext (toggleDay, completeItem,
// tending) so the two can't drift: a habit's daily check-in is 3 XP, every
// 7th check-in in a cycle adds a 15 XP bonus, and finishing a pursuit is
// 10 (habit), 25 (goal) or 50 (dream).
export const CHECKIN_XP = 3;

// What today's check-in would earn for this habit, bonus included.
export function nextCheckinXp(item) {
  const next = (item.streak || 0) + 1;
  return CHECKIN_XP + (next % STREAK_BONUS_INTERVAL === 0 ? STREAK_BONUS_XP : 0);
}

// "2 more days to the +15 bonus", or null.
export function bonusHint(item) {
  const left = STREAK_BONUS_INTERVAL - ((item.streak || 0) % STREAK_BONUS_INTERVAL);
  if (left === STREAK_BONUS_INTERVAL) return null;
  return left === 1 ? `Today brings the +${STREAK_BONUS_XP} bonus` : `${left} more days to the +${STREAK_BONUS_XP} bonus`;
}

export const finishXp = item => XP_VALS[item.type] || 10;
