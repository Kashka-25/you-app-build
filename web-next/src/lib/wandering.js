// Wanderings — helpers for travel plans that live as part of a Dream.
// Dates are local date keys (YYYY-MM-DD), like everything in lib/week.js,
// so "today" follows wherever the Seeker's device says they are.
import { localDateKey, addDaysKey } from "./week";

// Place search via Photon (OpenStreetMap data, free, no key). Only the
// typed place name leaves the device — nothing personal. Photon's own order
// already favours the well-known place (Lisbon, Portugal before Lisbon,
// Iowa), so it's kept; the only change is that stations, airports and
// buildings sit below towns and regions (still listed: a landmark can be a
// real stop), so "Kyoto" finds the city before Kyoto Station.
const isPlace = p => p.osm_key === "place" || p.osm_key === "boundary";
// Among places, an exact name match comes first ("Kyoto" before "Kyoto
// Prefecture"), ignoring case and accents.
const fold = t => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export async function searchPlaces(query, signal) {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = await res.json();
  const seen = new Set();
  return (data.features || [])
    .map(f => {
      const p = f.properties || {};
      // Context under the name, never repeating it ("Egypt" isn't shown
      // under Egypt).
      const detail = [p.city, p.state, p.country]
        .filter(v => v && v !== p.name)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ");
      return {
        name: p.name || q,
        detail,
        countryCode: p.countrycode || null,
        lng: f.geometry?.coordinates?.[0],
        lat: f.geometry?.coordinates?.[1],
        rank: isPlace(p) ? (fold(p.name) === fold(q) ? 0 : 1) : 2
      };
    })
    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    // Sort before de-duplicating, so when a station and its city read the
    // same ("Kyoto, Kyoto Prefecture"), the city is the one kept.
    .sort((a, b) => a.rank - b.rank)
    .filter(p => {
      const key = `${p.name}|${p.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

export function nightsBetween(arrive, depart) {
  if (!arrive || !depart) return null;
  return Math.round((new Date(depart + "T00:00:00") - new Date(arrive + "T00:00:00")) / 86400000);
}

// How precisely a stop's dates are known: "day" (exact), "month" or
// "year". Approximate stops store the start of their period and are only
// ever shown as precisely as they're known ("2019", "November 2023").
export const isExact = stop => (stop.date_precision || "day") === "day";

// The last day a stop could cover: its departure, or the end of its month
// or year when only that's known.
export function stopEnd(stop) {
  if (!stop.arrive) return null;
  if (stop.depart) return stop.depart;
  const d = new Date(stop.arrive + "T00:00:00");
  if (stop.date_precision === "year") return `${d.getFullYear()}-12-31`;
  if (stop.date_precision === "month") return localDateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return stop.arrive;
}

// Every date spent at a stop: arrive up to (not including) depart, or just
// the one day for a visit/transit or a same-day stop. Approximate stops
// have no real days to plan.
export function stopDays(stop) {
  if (!stop.arrive || !isExact(stop)) return [];
  const nights = nightsBetween(stop.arrive, stop.depart || stop.arrive) || 0;
  return Array.from({ length: Math.max(1, nights) }, (_, i) => addDaysKey(stop.arrive, i));
}

export function niceDay(dateKey, opts = { weekday: "short", day: "numeric", month: "short" }) {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-AU", opts);
}

// "2019" · "Jul – Oct 2026" · "November 2023" — a month or year span shown
// as the period it covers, never as made-up days.
function periodLabel(start, end, precision) {
  const a = new Date(start + "T00:00:00"), b = new Date((end || start) + "T00:00:00");
  if (precision === "year") {
    return a.getFullYear() === b.getFullYear() ? `${a.getFullYear()}` : `${a.getFullYear()} – ${b.getFullYear()}`;
  }
  const monthYear = d => d.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return monthYear(a);
  if (a.getFullYear() === b.getFullYear()) {
    return `${a.toLocaleDateString("en-AU", { month: "short" })} – ${b.toLocaleDateString("en-AU", { month: "short" })} ${a.getFullYear()}`;
  }
  return `${a.toLocaleDateString("en-AU", { month: "short", year: "numeric" })} – ${b.toLocaleDateString("en-AU", { month: "short", year: "numeric" })}`;
}

export function stopDateLabel(stop) {
  if (!stop.arrive) return "Dates not set";
  if (!isExact(stop)) return periodLabel(stop.arrive, stop.depart, stop.date_precision);
  const nights = nightsBetween(stop.arrive, stop.depart);
  const fmt = k => niceDay(k, { day: "numeric", month: "short" });
  if (!stop.depart || stop.depart === stop.arrive) return fmt(stop.arrive);
  return `${fmt(stop.arrive)} – ${fmt(stop.depart)} · ${nights} ${nights === 1 ? "night" : "nights"}`;
}

export function wanderingRange(stops) {
  const starts = stops.map(s => s.arrive).filter(Boolean).sort();
  const ends = stops.map(stopEnd).filter(Boolean).sort();
  if (!starts.length) return null;
  return { start: starts[0], end: ends[ends.length - 1] };
}

// A whole Wandering's "when", as precisely as its stops are known: exact
// dates when all are exact, otherwise the months or years they span.
export function wanderingWhenLabel(stops) {
  const range = wanderingRange(stops);
  if (!range) return null;
  const dated = stops.filter(s => s.arrive);
  const coarsest = dated.some(s => s.date_precision === "year") ? "year"
    : dated.some(s => s.date_precision === "month") ? "month" : "day";
  if (coarsest !== "day") return periodLabel(range.start, range.end, coarsest);
  const nights = nightsBetween(range.start, range.end);
  return `${niceDay(range.start, { day: "numeric", month: "short" })} – ${niceDay(range.end, { day: "numeric", month: "short", year: "numeric" })}${nights ? ` · ${nights} nights` : ""}`;
}

// Derived, never stored: dreaming (no dates yet), planned, travelling, travelled.
export function wanderingStatus(stops, today = localDateKey()) {
  const range = wanderingRange(stops);
  if (!range) return "dreaming";
  if (today < range.start) return "planned";
  if (today > range.end) return "travelled";
  return "travelling";
}

// Where the Seeker is today, across all Wanderings: the stop whose days
// include today (the last day of a stay counts as travel day to the next
// stop, which wins if it starts today).
export function stopForToday(wanderings, stopsByWandering, today = localDateKey()) {
  for (const y of wanderings) {
    const stops = stopsByWandering[y.id] || [];
    // Only exact stops: "somewhere in 2019" isn't a today.
    const here = stops.filter(s => isExact(s) && s.arrive && s.arrive <= today && (s.depart || s.arrive) >= today);
    if (!here.length) continue;
    const stop = here.sort((a, b) => (b.arrive > a.arrive ? 1 : -1))[0];
    const days = stopDays(stop);
    // Departure day of the final stop isn't one of its nights: call it the last day.
    const dayIndex = days.indexOf(today) === -1 ? days.length - 1 : days.indexOf(today);
    const next = stops.filter(s => s.position > stop.position && s.arrive && s.arrive > today)
      .sort((a, b) => a.position - b.position)[0] || null;
    return { wandering: y, stop, dayNumber: dayIndex + 1, dayCount: days.length, next };
  }
  return null;
}

// Stops whose dates include a given day (arrival through departure day),
// latest arrival first — on a travel day, where you arrived wins.
export function stopsCoveringDate(stops, dateKey) {
  if (!dateKey) return [];
  return stops
    .filter(s => isExact(s) && s.arrive && s.arrive <= dateKey && (s.depart || s.arrive) >= dateKey)
    .sort((a, b) => (b.arrive > a.arrive ? 1 : -1));
}

// A Wandering's "when" at month-or-coarser grain ("Apr 2026", "2019"), for
// places that summarise many trips (Constellations, the world map).
export function wanderingPeriodLabel(stops) {
  const range = wanderingRange(stops);
  if (!range) return "";
  return periodLabel(range.start, range.end, stops.some(s => s.arrive && s.date_precision === "year") ? "year" : "month");
}
