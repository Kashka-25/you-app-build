// The Crossroads — finds the order of the Seeker's values by setting two
// side by side at a time. A binary insertion sort, so 5 values take about
// 8 crossings and 9 take about 20, never every possible pair.
//
// The order is kept as groups (values felt as equal share a group), first
// group = True North. Every step returns a new state, so "Back" is just
// the previous state.

const PROMPTS = [
  "If this season only had room for one, which would you protect?",
  "On a hard day, which would you reach for first?",
  "Looking back, which would you regret neglecting more?",
  "If one had to wait a while, which would you keep close?",
  "When these two pull against each other, which do you want to win?"
];

export function promptFor(index) {
  return PROMPTS[index % PROMPTS.length];
}

// Upper bound on crossings: inserting the k-th value into k-1 placed ones
// takes at most ceil(log2(k)) comparisons. Ties only make it shorter.
export function estimateCrossings(n) {
  let total = 0;
  for (let k = 2; k <= n; k++) total += Math.ceil(Math.log2(k));
  return total;
}

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffled so no value is favoured by where it happens to sit in the list.
export function startCrossroads(names) {
  const [first, ...rest] = shuffled(names);
  return next({ groups: first ? [[first]] : [], pending: rest, current: null, lo: 0, hi: 0, answered: 0, timings: [] });
}

function next(state) {
  if (state.current || !state.pending.length) return state;
  const [current, ...pending] = state.pending;
  return { ...state, current, pending, lo: 0, hi: state.groups.length };
}

export function isDone(state) {
  return !state.current;
}

// The pair on screen: the value being placed, and the group it is measured
// against (by its first member).
export function currentPair(state) {
  if (!state.current) return null;
  const mid = Math.floor((state.lo + state.hi) / 2);
  return { mid, a: state.current, b: state.groups[mid][0] };
}

function place(state, groups) {
  return next({ ...state, groups, current: null });
}

// choice: "a" (the value being placed wins), "b" (the placed one wins) or
// "equal". seconds: how long the Seeker sat with this crossing.
export function answer(state, choice, seconds) {
  const { mid, a, b } = currentPair(state);
  const timings = [...state.timings, { pair: [a, b], seconds }];
  const s = { ...state, answered: state.answered + 1, timings };
  if (choice === "equal") {
    return place(s, s.groups.map((g, i) => (i === mid ? [...g, a] : g)));
  }
  const lo = choice === "b" ? mid + 1 : s.lo;
  const hi = choice === "a" ? mid : s.hi;
  if (lo >= hi) {
    return place(s, [...s.groups.slice(0, lo), [a], ...s.groups.slice(lo)]);
  }
  return { ...s, lo, hi };
}

// The crossing the Seeker sat with longest, if any was a real pause.
export function hardestCrossing(timings) {
  const longest = [...(timings || [])].sort((x, y) => y.seconds - x.seconds)[0];
  return longest && longest.seconds >= 4 ? { pair: longest.pair, seconds: Math.round(longest.seconds) } : null;
}

// Groups ⇄ a flat list the Seeker can nudge up and down. tiedWithPrev
// marks a value felt as equal to the one above it.
export function flatten(groups) {
  return groups.flatMap(g => g.map((name, i) => ({ name, tiedWithPrev: i > 0 })));
}

export function regroup(rows) {
  const groups = [];
  rows.forEach(r => {
    if (r.tiedWithPrev && groups.length) groups[groups.length - 1].push(r.name);
    else groups.push([r.name]);
  });
  return groups;
}

// Moving a value lifts it out of any tie: it now stands in its own place.
export function move(rows, index, delta) {
  const to = index + delta;
  if (to < 0 || to >= rows.length) return rows;
  const out = rows.map(r => ({ ...r }));
  if (out[index + 1]?.tiedWithPrev) out[index + 1].tiedWithPrev = out[index].tiedWithPrev;
  const [item] = out.splice(index, 1);
  item.tiedWithPrev = false;
  out.splice(to, 0, item);
  if (out[to + 1]) out[to + 1].tiedWithPrev = false;
  if (out[0]) out[0].tiedWithPrev = false;
  return out;
}

// Rank shown beside each row (tied values share one).
export function ranks(rows) {
  let rank = 0;
  return rows.map(r => (r.tiedWithPrev ? rank : ++rank));
}

// Has the Seeker's focus changed since this compass was set?
export function compassIsStale(compass, activeNames) {
  if (!compass) return false;
  const inCompass = (compass.ordering || []).flat();
  return inCompass.length !== activeNames.length || activeNames.some(n => !inCompass.includes(n));
}
