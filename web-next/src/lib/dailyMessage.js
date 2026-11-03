import { MEMENTOS } from "../constants/mementos";

// The welcome's personal message (Cassidy, Nov 3: keep the sweet,
// inspirational message in the head banner). Your own compass line comes
// first. Without one, a message for the day: on most days one of the words
// you kept as mementos from your YOUrnal, otherwise a line from the memento
// collection (Cassidy's own lines among them). It stays the same all day and
// changes the next, in each Seeker's own order.
export function dailyMessage({ compassLine, highlights = [], userId = "", dateKey }) {
  if (compassLine) return { text: compassLine, by: null, personal: true };

  const day = Math.floor(new Date(dateKey + "T00:00:00").getTime() / 86400000);
  const seed = hash(`${userId}:${day}`);
  const kept = highlights.filter(h => h.as_memento && h.text);
  // Your own words on two days in three, when you've kept any.
  if (kept.length && seed % 3 !== 0) {
    const h = kept[seed % kept.length];
    return { text: h.text, by: "From your YOUrnal", personal: true };
  }
  const m = MEMENTOS[seed % MEMENTOS.length];
  return { text: m.text, by: m.author, personal: false };
}

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
