// Mementos: one grows with the flower that completes each hour of focus.
//
// Rules for this list (so nothing here is plagiarised or misquoted):
// - Public domain only: ancient texts, or writers whose work is long out of
//   copyright. No modern authors, and no modern translations of the
//   ancients (e.g. Rumi or Hafiz "versions"); old public-domain
//   translations, or plain renderings of the original, instead.
// - Always credited, with the work it comes from.
// - No famous misattributions (the internet is full of "Confucius" and
//   "Einstein" lines they never said). If a source can't be named, it
//   doesn't go in.
// Three kinds, all in one shuffle:
// - "classic": the greats, under the rules above.
// - "creator": Cassidy Dugan's own works, added as they're written.
// - "you": original lines written for the app, credited as "A message
//   directly from YOU" (never passed off as anyone else's).
// Ids are stable: saved sessions point at them, so never renumber; add new
// ones at the end, whatever their kind.

export const MEMENTOS = [
  { id: 1, text: "Hold every hour in your grasp. Lay hold of today’s task, and you will not need to depend so much upon tomorrow’s.", author: "Seneca", source: "Letters to Lucilius, I" },
  { id: 2, text: "While we are postponing, life speeds by.", author: "Seneca", source: "Letters to Lucilius, I" },
  { id: 3, text: "As long as you live, keep learning how to live.", author: "Seneca", source: "Letters to Lucilius, LXXVI" },
  { id: 4, text: "No great thing is produced suddenly, since not even the bunch of grapes or the fig is.", author: "Epictetus", source: "Discourses, I.15" },
  { id: 5, text: "Such as are thy habitual thoughts, such also will be the character of thy mind; for the soul is dyed by the thoughts.", author: "Marcus Aurelius", source: "Meditations, V.16" },
  { id: 6, text: "No longer talk at all about the kind of man that a good man ought to be, but be such.", author: "Marcus Aurelius", source: "Meditations, X.16" },
  { id: 7, text: "Very little indeed is necessary for living a happy life.", author: "Marcus Aurelius", source: "Meditations, VII.67" },
  { id: 8, text: "We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.", author: "Aristotle", source: "Nicomachean Ethics, II.1" },
  { id: 9, text: "The beginning is the most important part of any work.", author: "Plato", source: "The Republic, II" },
  { id: 10, text: "A journey of a thousand miles begins beneath one’s feet.", author: "Lao Tzu", source: "Tao Te Ching, 64" },
  { id: 11, text: "He who overcomes others is strong; he who overcomes himself is mighty.", author: "Lao Tzu", source: "Tao Te Ching, 33" },
  { id: 12, text: "Is virtue a thing remote? I wish to be virtuous, and lo! virtue is at hand.", author: "Confucius", source: "Analects, VII.29" },
  { id: 13, text: "To every thing there is a season, and a time to every purpose under the heaven.", author: "Ecclesiastes", source: "3:1" },
  { id: 14, text: "The creation of a thousand forests is in one acorn.", author: "Ralph Waldo Emerson", source: "History" },
  { id: 15, text: "Trust thyself: every heart vibrates to that iron string.", author: "Ralph Waldo Emerson", source: "Self-Reliance" },
  { id: 16, text: "If one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.", author: "Henry David Thoreau", source: "Walden" },
  { id: 17, text: "I went to the woods because I wished to live deliberately.", author: "Henry David Thoreau", source: "Walden" },
  { id: 18, text: "I exist as I am, that is enough.", author: "Walt Whitman", source: "Song of Myself" },
  { id: 19, text: "Do I contradict myself? Very well then I contradict myself, (I am large, I contain multitudes.)", author: "Walt Whitman", source: "Song of Myself" },
  { id: 20, text: "‘Hope’ is the thing with feathers – that perches in the soul.", author: "Emily Dickinson", source: "‘Hope’ is the thing with feathers" },
  { id: 21, text: "Forever – is composed of Nows –", author: "Emily Dickinson", source: "Forever – is composed of Nows –" },
  { id: 22, text: "I dwell in Possibility –", author: "Emily Dickinson", source: "I dwell in Possibility –" },
  { id: 23, text: "Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.", author: "William Shakespeare", source: "Measure for Measure, I.4" },
  { id: 24, text: "We know what we are, but know not what we may be.", author: "William Shakespeare", source: "Hamlet, IV.5" },
  { id: 25, text: "To see a World in a Grain of Sand, and a Heaven in a Wild Flower.", author: "William Blake", source: "Auguries of Innocence" },
  { id: 26, text: "Come forth into the light of things, let Nature be your teacher.", author: "William Wordsworth", source: "The Tables Turned" },
  { id: 27, text: "To strive, to seek, to find, and not to yield.", author: "Alfred, Lord Tennyson", source: "Ulysses" },
  { id: 28, text: "A thing of beauty is a joy for ever.", author: "John Keats", source: "Endymion" },
  { id: 29, text: "No coward soul is mine.", author: "Emily Brontë", source: "No coward soul is mine" },
  { id: 30, text: "If I have seen further it is by standing on the shoulders of Giants.", author: "Isaac Newton", source: "Letter to Robert Hooke, 1675" },
  { id: 31, text: "Work is love made visible.", author: "Kahlil Gibran", source: "The Prophet" },
  { id: 32, text: "The same stream of life that runs through my veins night and day runs through the world and dances in rhythmic measures.", author: "Rabindranath Tagore", source: "Gitanjali, 69" },

  // ── A message directly from YOU ──
  { id: 33, kind: "you", text: "You don’t have to feel ready. You only have to begin, and let the beginning teach you." },
  { id: 34, kind: "you", text: "An hour given with your whole attention is a quiet kind of love." },
  { id: 35, kind: "you", text: "Roots grow in the dark long before anything shows above the soil. Keep going." },
  { id: 36, kind: "you", text: "Nothing you tend with care is wasted, not even on the days it doesn’t seem to grow." },
  { id: 37, kind: "you", text: "You are not behind. You are exactly where your next step begins." },
  { id: 38, kind: "you", text: "Small and steady is still moving. Look how far small has carried you." },
  { id: 39, kind: "you", text: "Rest is part of the rhythm, not a break from it." },
  { id: 40, kind: "you", text: "The person you’re becoming is built from hours exactly like this one." },
  { id: 41, kind: "you", text: "Let it be imperfect. Let it be yours." },
  { id: 42, kind: "you", text: "Every bloom in this garden began as a seed you chose to plant." },
  { id: 43, kind: "you", text: "Your attention is the most precious thing you give. Today you gave it to what matters." },
  { id: 44, kind: "you", text: "Be as patient with yourself as you would be with anything you love that’s still growing." }

  // ── Cassidy Dugan ──
  // Add Cassidy's own lines here as they're written, e.g.
  // { id: 45, kind: "creator", text: "…", author: "Cassidy Dugan", source: "<the work, if it has a name>" },
];

// How a memento is credited underneath its line.
export function creditOf(m) {
  if (m.kind === "you") return { author: "A message directly from YOU", source: null };
  return { author: m.author, source: m.source || null };
}

export function getMemento(id) {
  return MEMENTOS.find(m => m.id === id) || null;
}

// The memento for the Seeker's n-th hour of focus (1-based). Each Seeker
// walks the whole list in their own shuffled order before any repeats.
export function mementoForHour(hour, seed = "") {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const order = MEMENTOS.map((m, i) => ({ id: m.id, k: Math.imul(h ^ (i + 1), 2654435761) >>> 0 })).sort((a, b) => a.k - b.k);
  return order[(hour - 1) % order.length].id;
}
