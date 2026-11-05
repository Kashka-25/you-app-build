// "My Story" — assembles the Seeker's memoir from what they've already kept.
// Their own words only: nothing here is generated, summarised or sent
// anywhere. One book model feeds both the printable page and the Markdown
// download, so the two can't drift apart.
import { placesInYear, yearsWithLife, yearSummary } from "./years";
import { stopDateLabel } from "./wandering";
import { getValueEntry } from "../constants/valueLibrary";

const yearOf = k => (k ? Number(k.slice(0, 4)) : null);

// "Cambodia" rather than "Cambodia: Cambodia" when a trip is one place of
// the same name.
export function tripLine(t) {
  const names = t.places.map(p => p.name);
  return names.length === 1 && names[0] === t.title ? t.title : `${t.title}: ${names.join(", ")}`;
}
export const niceDate = k => new Date(k + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

// What the Seeker can choose to include. From the YOUrnal, the book takes
// the highlights: the lines they chose to keep, not whole entries
// (Cassidy, Nov 5).
export const SECTIONS = [
  { key: "places", label: "Places and journeys", on: true },
  { key: "dreams", label: "Dreams lived", on: true },
  { key: "moments", label: "Memories (with photos)", on: true },
  { key: "seasons", label: "Seasons", on: true },
  { key: "harvests", label: "Harvest notes", on: true },
  { key: "highlights", label: "Journal highlights", on: true },
  { key: "chapters", label: "Life chapters", on: true },
  { key: "growing", label: "What I'm growing toward", on: true }
];

// Lines kept from the same entry (or, without one, the same day) become
// one passage, in the order they were kept.
function gatherWords(highlights) {
  const passages = new Map();
  for (const h of highlights) {
    const key = h.entry || `day:${h.date}`;
    if (!passages.has(key)) passages.set(key, { kind: "words", date: h.date, lines: [] });
    passages.get(key).lines.push(h.text);
  }
  return [...passages.values()];
}

// On the same day, the memory first, then the words, then the harvest.
const KIND_ORDER = { memory: 0, words: 1, harvest: 2 };

export function buildStory(data, include) {
  const { profile, moments, highlights = [], weekHarvests, seasons = [], chapters = [], values = [], identityVisions = [], items = [] } = data;
  const placeName = stopId => data.wanderingStops.find(s => s.id === stopId)?.place_name || null;

  const years = yearsWithLife(data).slice().sort((a, b) => a - b).map(year => {
    const places = include.places ? placesInYear(year, data) : null;
    const summary = yearSummary(year, data);
    const y = {
      year,
      seasons: include.seasons ? seasons.filter(s => yearOf(s.created_at?.slice(0, 10)) === year).reverse() : [],
      trips: places?.trips.map(t => ({
        title: t.wandering.title,
        places: t.places.map(p => ({ name: p.stop.place_name, detail: p.stop.place_detail, when: p.stop.arrive ? stopDateLabel(p.stop) : null, note: p.stop.note }))
      })) || [],
      countries: places?.countries || [],
      // A travel dream already told under "Where I went" isn't repeated.
      dreams: include.dreams ? summary.dreams.filter(d => !(places?.trips || []).some(t => t.wandering.title === d)) : [],
      moments: include.moments
        ? moments.filter(m => yearOf(m.moment_date) === year).sort((a, b) => (a.moment_date > b.moment_date ? 1 : -1))
            .map(m => ({ title: m.title, date: m.moment_date, text: m.description, photo: m.photo_url, morePhotos: (m.photo_urls || []).slice(1), place: placeName(m.stop_id) }))
        : [],
      harvests: include.harvests
        ? summary.harvests.filter(h => (h.note || "").trim()).sort((a, b) => (a.week_start > b.week_start ? 1 : -1)).map(h => ({ week: h.week_start, note: h.note.trim() }))
        : [],
      highlights: include.highlights
        ? highlights
            .map(h => ({ date: h.entry_date || (h.created_at || "").slice(0, 10), text: (h.text || "").trim(), entry: h.entry_id || null, kept: h.created_at || "" }))
            .filter(h => h.text && yearOf(h.date) === year)
            // by date, and lines from the same day in the order they were kept
            .sort((a, b) => a.date.localeCompare(b.date) || a.kept.localeCompare(b.kept))
        : []
    };
    // Through the year (Cassidy, Nov 5): memories, the words kept and the
    // harvest notes in one flow by date, so it alternates naturally.
    y.flow = [
      ...y.moments.map(m => ({ kind: "memory", date: m.date, ...m })),
      ...gatherWords(y.highlights),
      ...y.harvests.map(h => ({ kind: "harvest", date: h.week, ...h }))
    ].sort((a, b) => (a.date === b.date ? KIND_ORDER[a.kind] - KIND_ORDER[b.kind] : a.date > b.date ? 1 : -1));
    y.empty = !y.seasons.length && !y.trips.length && !y.dreams.length && !y.flow.length;
    return y;
  }).filter(y => !y.empty);

  const chapterList = include.chapters
    ? [...chapters].sort((a, b) => (a.range_start > b.range_start ? 1 : -1)).map(c => ({
        title: c.title, from: c.range_start, to: c.range_end, blurb: c.blurb,
        moments: moments.filter(m => m.moment_date >= c.range_start && (!c.range_end || m.moment_date <= c.range_end)).map(m => m.title)
      }))
    : [];

  const growing = include.growing
    ? {
        values: values.filter(v => v.status !== "rested").map(v => ({ name: v.name, meaning: v.definition || getValueEntry(v.name)?.essence || "" })),
        visions: identityVisions.map(v => ({ title: v.title, statement: v.statement, category: v.category })),
        dreams: items.filter(i => i.type === "dream" && !i.done).map(i => i.name)
      }
    : null;

  const allYears = years.map(y => y.year);
  return {
    title: "My Story",
    author: profile?.name || "",
    span: allYears.length ? (allYears[0] === allYears[allYears.length - 1] ? `${allYears[0]}` : `${allYears[0]} – ${allYears[allYears.length - 1]}`) : "",
    years,
    chapters: chapterList,
    growing: growing && (growing.values.length || growing.visions.length || growing.dreams.length) ? growing : null,
    made: niceDate(new Date().toISOString().slice(0, 10))
  };
}

// The same book as plain Markdown, for a portable copy.
export function storyToMarkdown(book) {
  const out = [];
  out.push(`# ${book.title}`);
  if (book.author) out.push(`*${book.author}*`);
  if (book.span) out.push(book.span);
  out.push("");
  book.years.forEach(y => {
    out.push(`## ${y.year}`, "");
    y.seasons.forEach(s => out.push(`**${s.name}**${s.blurb ? ` — ${s.blurb}` : ""}`, ""));
    if (y.trips.length) {
      out.push("### Where I went", "");
      if (y.countries.length) out.push(y.countries.join(" · "), "");
      y.trips.forEach(t => {
        const line = tripLine(t);
        out.push(line === t.title ? `- **${t.title}**` : `- **${t.title}**: ${t.places.map(p => p.name).join(", ")}`);
        t.places.filter(p => p.note).forEach(p => out.push(`  - ${p.name}: ${p.note}`));
      });
      out.push("");
    }
    if (y.dreams.length) out.push("### Dreams I lived", "", ...y.dreams.map(d => `- ${d}`), "");
    if (y.flow.length) {
      out.push("### Through the year", "");
      y.flow.forEach(f => {
        if (f.kind === "memory") {
          out.push(`**${f.title}** — ${niceDate(f.date)}${f.place ? ` · ${f.place}` : ""}`);
          if (f.text) out.push("", f.text);
          out.push("");
        } else if (f.kind === "words") {
          f.lines.forEach((line, i) => out.push(`> ${line.replace(/\n/g, "\n> ")}`, ...(i < f.lines.length - 1 ? [">"] : [])));
          out.push(`> — from my YOUrnal, ${niceDate(f.date)}`, "");
        } else {
          out.push(`> ${f.note}`, `> — from my harvest, week of ${niceDate(f.date)}`, "");
        }
      });
    }
  });
  if (book.chapters.length) {
    out.push("## Chapters of my life", "");
    book.chapters.forEach(c => {
      out.push(`### ${c.title}`, `${niceDate(c.from)}${c.to ? ` – ${niceDate(c.to)}` : " – now"}`, "");
      if (c.blurb) out.push(c.blurb, "");
      if (c.moments.length) out.push(...c.moments.map(t => `- ${t}`), "");
    });
  }
  if (book.growing) {
    out.push("## What I'm growing toward", "");
    if (book.growing.values.length) out.push("### My values", "", ...book.growing.values.map(v => `- **${v.name}**${v.meaning ? `: ${v.meaning}` : ""}`), "");
    if (book.growing.visions.length) out.push("### Who I'm becoming", "", ...book.growing.visions.map(v => `- **${v.title}**: ${v.statement}`), "");
    if (book.growing.dreams.length) out.push("### Dreams still ahead", "", ...book.growing.dreams.map(d => `- ${d}`), "");
  }
  out.push("---", `Kept in YOU · ${book.made}`);
  return out.join("\n");
}

// My Story's cover photo (Cassidy, Nov 5): the one chosen (saved as its
// storage path in the account's prefs), or the newest memory photo.
export function coverPhotos(moments) {
  return [...moments]
    .sort((a, b) => (a.moment_date < b.moment_date ? 1 : -1))
    .flatMap(m => (m.photo_items || []).filter(p => p.url).map(p => ({ path: p.path, thumb: p.thumb || p.url, url: p.url, title: m.title })));
}
export function storyCover(moments, chosenPath) {
  const all = coverPhotos(moments);
  return all.find(p => p.path === chosenPath) || all[0] || null;
}
