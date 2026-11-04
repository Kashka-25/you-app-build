import { habitDays } from "./xp";
import { weekStartKey, addDaysKey } from "./week";

// Identity visions and the pursuits that grow them (Nov 4: "Meet your
// future self"). Every tick of a linked habit is a vote for who you're
// becoming (identity-based habits).

export const HORIZONS = [
  { key: "1y", label: "One year", phrase: "a year" },
  { key: "5y", label: "Five years", phrase: "five years" },
  { key: "10y", label: "Ten years or more", phrase: "ten years" }
];
export const horizonPhrase = key => (HORIZONS.find(h => h.key === key) || HORIZONS[1]).phrase;

// The pursuits linked to a vision that still exist, in the order chosen.
export function visionItems(vision, items) {
  const ids = vision?.item_ids || [];
  return ids.map(id => items.find(i => i.id === id)).filter(Boolean);
}

// Days this week a linked habit was ticked or stepped, summed across them.
export function votesThisWeek(vision, items, memory, habitLogs, today = new Date()) {
  const start = weekStartKey(today);
  const end = addDaysKey(start, 6);
  let votes = 0;
  for (const item of visionItems(vision, items)) {
    if (item.type !== "habit") continue;
    for (const day of habitDays(item, memory, habitLogs)) if (day >= start && day <= end) votes++;
  }
  return votes;
}

// The visions a pursuit grows, for its own card.
export function visionsFor(item, visions) {
  return visions.filter(v => (v.item_ids || []).includes(item.id));
}

const QUIET = new Set(("a an and are as at be been but by can could did do does for from had has have he her his i in into is it its just like me more most my no not of on one or our so some such than that the their them then there these they this to too us very was we were what when where which who will with would you your yours really always never still every someone something they'd they're you're you've i'm im it's dont don't who's lot lots much many also how about through"
).split(" "));

// The words that keep coming up in what the closest people would say: the
// raw material for naming who you're becoming, no AI needed.
export function recurringWords(voices, limit = 8) {
  const counts = new Map();
  for (const v of voices || []) {
    const seen = new Set();
    for (const raw of `${v.says || ""}`.toLowerCase().match(/[a-z'’-]+/g) || []) {
      const w = raw.replace(/[’']/g, "'").replace(/^'+|'+$/g, "");
      if (w.length < 4 || QUIET.has(w) || seen.has(w)) continue;
      seen.add(w);
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, n]) => ({ word, n }));
}
