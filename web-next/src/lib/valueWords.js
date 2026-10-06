// Values in a Seeker's own words: tidying a typed word, finding where it
// lives in the Codex (a value's name, synonym or sub-value), and the
// closest Codex values when it isn't there.
import { VALUE_LIBRARY } from "../constants/valueLibrary";

export function normalizeWord(text) {
  return (text || "").trim().replace(/\s+/g, " ").toLowerCase();
}

// "  self respect " → "Self respect". Keeps the Seeker's own wording.
export function displayWord(text) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  return t ? t[0].toUpperCase() + t.slice(1) : "";
}

// A word worth keeping as a value: letters (any language), spaces,
// hyphens and apostrophes; 2–30 characters.
export function validWord(text) {
  const t = (text || "").trim();
  return t.length >= 2 && t.length <= 30 && /^[\p{L}][\p{L}\s'’-]*$/u.test(t);
}

export function isCodexValue(name) {
  return VALUE_LIBRARY.some(v => v.name === name);
}

// The Codex value a word belongs to, if any, and how: "name" | "synonym" | "sub-value".
export function findInCodex(text) {
  const n = normalizeWord(text);
  if (!n) return null;
  for (const v of VALUE_LIBRARY) {
    if (v.name.toLowerCase() === n) return { value: v, via: "name" };
  }
  for (const v of VALUE_LIBRARY) {
    if ((v.synonyms || []).some(s => s.toLowerCase() === n)) return { value: v, via: "synonym" };
    if ((v.subValues || []).some(s => s.toLowerCase() === n)) return { value: v, via: "sub-value" };
  }
  return null;
}

function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// Up to `limit` Codex values close to a word: in its name, synonyms or
// sub-values, or a near spelling. Best first.
export function closestValues(text, limit = 3) {
  const n = normalizeWord(text);
  if (n.length < 2) return [];
  const scored = VALUE_LIBRARY.map(v => {
    const name = v.name.toLowerCase();
    const words = [...(v.synonyms || []), ...(v.subValues || [])].map(s => s.toLowerCase());
    let score = 0;
    if (name.startsWith(n) || n.startsWith(name)) score = 5;
    else if (name.includes(n)) score = 4;
    else if (words.some(w => w === n)) score = 6;
    else if (words.some(w => w.includes(n) || (n.length > 3 && n.includes(w)))) score = 3;
    else if (distance(name, n) <= 2 || words.some(w => distance(w, n) <= 1)) score = 2;
    return { v, score };
  }).filter(x => x.score > 0);
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.v);
}
