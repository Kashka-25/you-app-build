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
      const detail = [p.city !== p.name ? p.city : null, p.state !== p.name ? p.state : null, p.country]
        .filter(Boolean)
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

// Every date spent at a stop: arrive up to (not including) depart, or just
// the one day for a visit/transit or a same-day stop.
export function stopDays(stop) {
  if (!stop.arrive) return [];
  const nights = nightsBetween(stop.arrive, stop.depart || stop.arrive) || 0;
  return Array.from({ length: Math.max(1, nights) }, (_, i) => addDaysKey(stop.arrive, i));
}

export function niceDay(dateKey, opts = { weekday: "short", day: "numeric", month: "short" }) {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-AU", opts);
}

export function stopDateLabel(stop) {
  if (!stop.arrive) return "Dates not set";
  const nights = nightsBetween(stop.arrive, stop.depart);
  const fmt = k => niceDay(k, { day: "numeric", month: "short" });
  if (!stop.depart || stop.depart === stop.arrive) return fmt(stop.arrive);
  return `${fmt(stop.arrive)} – ${fmt(stop.depart)} · ${nights} ${nights === 1 ? "night" : "nights"}`;
}

export function wanderingRange(stops) {
  const starts = stops.map(s => s.arrive).filter(Boolean).sort();
  const ends = stops.map(s => s.depart || s.arrive).filter(Boolean).sort();
  if (!starts.length) return null;
  return { start: starts[0], end: ends[ends.length - 1] };
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
    const here = stops.filter(s => s.arrive && s.arrive <= today && (s.depart || s.arrive) >= today);
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
