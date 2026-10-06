// YOUniversity helpers: how much an Arcanum or an own tool has been used,
// read from what's already saved (no counters to drift).
import { localDateKey, addDaysKey } from "./week";

const FINAL_KIND = { light_shadow: "integration", freeing_dream: "outcome" };

export function niceDate(isoOrKey) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(isoOrKey) ? new Date(isoOrKey + "T00:00:00") : new Date(isoOrKey);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Sittings of a questionnaire Arcanum: how many, how many finished, when last.
export function arcanumProgress(arcanum, reflections) {
  if (!arcanum?.questionnaire) return { sittings: 0, finished: 0, lastAt: null };
  const rows = reflections.filter(r => r.session_id && r.questionnaire === arcanum.questionnaire);
  const sessions = [...new Set(rows.map(r => r.session_id))];
  const finished = sessions.filter(id => rows.some(r => r.session_id === id && r.kind === FINAL_KIND[arcanum.questionnaire])).length;
  const lastAt = rows.reduce((m, r) => {
    const at = r.updated_at || r.inserted_at;
    return !m || at > m ? at : m;
  }, null);
  return { sittings: sessions.length, finished, lastAt };
}

export function progressLine(p) {
  if (!p.sittings) return "Not opened yet";
  const s = `${p.sittings} sitting${p.sittings === 1 ? "" : "s"}`;
  return `${s} · last ${niceDate(p.lastAt)}`;
}

// An own tool's use: days used, the last one, and the last `days` days as a
// strip of true/false (oldest first) on the device's own date.
export function toolProgress(tool, days = 28) {
  const used = new Set(tool.used_dates || []);
  const today = localDateKey();
  const strip = Array.from({ length: days }, (_, i) => {
    const key = addDaysKey(today, i - (days - 1));
    return { key, used: used.has(key) };
  });
  const sorted = [...used].sort();
  return {
    total: used.size,
    last: sorted[sorted.length - 1] || null,
    usedToday: used.has(today),
    inWindow: strip.filter(d => d.used).length,
    strip
  };
}

export function toolLine(tool) {
  const p = toolProgress(tool);
  if (!p.total) return "Not used yet";
  return `Used ${p.total} day${p.total === 1 ? "" : "s"} · last ${niceDate(p.last)}`;
}
