// Mood as a 0–100 scale (Cassidy, Oct 27). The five words stay, worked out
// from the score, so everything that reads `mood` keeps working.
export const MOOD_BANDS = [
  { key: "rough", label: "Low", from: 0 },
  { key: "low", label: "Tender", from: 20 },
  { key: "okay", label: "Steady", from: 40 },
  { key: "good", label: "Good", from: 60 },
  { key: "great", label: "Energised", from: 80 }
];

export function bandFor(score) {
  return [...MOOD_BANDS].reverse().find(b => score >= b.from) || MOOD_BANDS[0];
}

// For entries saved before the scale: the middle of their word's band.
const MIDDLE = { rough: 10, low: 30, okay: 50, good: 70, great: 90 };
export function scoreOf(entry) {
  if (!entry) return null;
  if (entry.score != null) return Number(entry.score);
  return MIDDLE[entry.mood] ?? null;
}

// Warm to fresh, none of them "bad": terracotta, amber, gold, sage, leaf.
const STOPS = [[0, [200, 102, 90]], [25, [208, 138, 78]], [50, [201, 162, 60]], [75, [111, 154, 94]], [100, [111, 138, 62]]];
export function moodColour(score) {
  const s = Math.max(0, Math.min(100, score));
  for (let i = 1; i < STOPS.length; i++) {
    const [b, cb] = STOPS[i];
    const [a, ca] = STOPS[i - 1];
    if (s <= b) {
      const t = (s - a) / (b - a);
      const c = ca.map((v, k) => Math.round(v + (cb[k] - v) * t));
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }
  }
  return "rgb(111, 138, 62)";
}
