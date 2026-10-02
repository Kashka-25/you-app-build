// Year-by-year views of a life (The Mirror, Legacy). Everything here reads
// data already loaded; nothing is stored.

const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return code => (code ? dn.of(code.toUpperCase()) : null);
  } catch {
    return code => code || null;
  }
})();

const yearOf = dateKey => (dateKey ? Number(dateKey.slice(0, 4)) : null);

// Places reached in a given year: Wandering stops that began that year,
// whether known to the day or only as "2019". Undated stops can't be placed
// in a year, so they're left out here (they still show on the world map).
export function placesInYear(year, { wanderings, wanderingStops, moments = [], journalEntries = [] }) {
  const memories = {};
  [...moments, ...journalEntries].forEach(m => { if (m.stop_id) memories[m.stop_id] = (memories[m.stop_id] || 0) + 1; });
  const places = wanderingStops
    .filter(s => s.arrive && yearOf(s.arrive) === year)
    .map(s => ({ stop: s, wandering: wanderings.find(w => w.id === s.wandering_id), memories: memories[s.id] || 0 }))
    .filter(p => p.wandering);
  const trips = [];
  places.forEach(p => {
    let t = trips.find(x => x.wandering.id === p.wandering.id);
    if (!t) trips.push((t = { wandering: p.wandering, places: [] }));
    t.places.push(p);
  });
  trips.forEach(t => t.places.sort((a, b) => a.stop.position - b.stop.position));
  const countries = [...new Set(places.map(p => p.stop.country_code).filter(Boolean))].map(regionName).filter(Boolean).sort();
  const uniquePlaces = new Set(places.map(p => `${p.stop.place_name}|${p.stop.lat.toFixed(2)}|${p.stop.lng.toFixed(2)}`)).size;
  return { year, trips, countries, placeCount: uniquePlaces, memoryCount: places.reduce((n, p) => n + p.memories, 0) };
}

// Every year the Seeker's story has something in it, newest first.
export function yearsWithLife({ wanderingStops, moments, journalEntries, memory, weekHarvests }, thisYear = new Date().getFullYear()) {
  const years = new Set([thisYear]);
  wanderingStops.forEach(s => s.arrive && years.add(yearOf(s.arrive)));
  moments.forEach(m => years.add(yearOf(m.moment_date)));
  journalEntries.forEach(e => years.add(yearOf(e.entry_date)));
  memory.forEach(m => m.date_key && years.add(yearOf(m.date_key)));
  weekHarvests.forEach(h => years.add(yearOf(h.week_start)));
  return [...years].filter(y => y && y <= thisYear).sort((a, b) => b - a);
}

// The year a dream was actually lived. A dream with a dated Wandering
// belongs to the year that journey began, not the day it was ticked off in
// the app (remembered trips are often marked done years later); otherwise
// its completion date.
function dreamYear(row, { items = [], releasedItems = [], wanderings = [], wanderingStops = [] }) {
  const item = [...items, ...releasedItems].find(i => i.type === "dream" && i.name === row.name);
  const w = item && wanderings.find(x => x.item_id === item.id);
  const start = w && wanderingStops.filter(st => st.wandering_id === w.id && st.arrive).map(st => st.arrive).sort()[0];
  return start ? yearOf(start) : yearOf(row.date_key);
}

// What a year held, beyond places: memories, journal entries, dreams
// lived, harvests gathered.
export function yearSummary(year, data) {
  const { moments, journalEntries, memory, weekHarvests } = data;
  const inYear = k => yearOf(k) === year;
  return {
    moments: moments.filter(m => inYear(m.moment_date)).length,
    entries: journalEntries.filter(e => inYear(e.entry_date)).length,
    dreams: memory.filter(m => m.type === "dream" && (m.xp || 0) > 0 && dreamYear(m, data) === year).map(m => m.name),
    harvests: weekHarvests.filter(h => inYear(h.week_start))
  };
}
