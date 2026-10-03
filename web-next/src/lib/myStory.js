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

// What the Seeker can choose to include. Journal entries are the most
// private, so they start switched off.
export const SECTIONS = [
  { key: "places", label: "Places and journeys", on: true },
  { key: "dreams", label: "Dreams lived", on: true },
  { key: "moments", label: "Memories (with photos)", on: true },
  { key: "seasons", label: "Seasons", on: true },
  { key: "harvests", label: "Harvest notes", on: true },
  { key: "journal", label: "Journal entries", on: false },
  { key: "chapters", label: "Life chapters", on: true },
  { key: "growing", label: "What I'm growing toward", on: true }
];

export function buildStory(data, include) {
  const { profile, moments, journalEntries, weekHarvests, seasons = [], chapters = [], values = [], identityVisions = [], items = [] } = data;
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
      journal: include.journal
        ? journalEntries.filter(e => yearOf(e.entry_date) === year).sort((a, b) => (a.entry_date > b.entry_date ? 1 : -1))
            .map(e => ({ date: e.entry_date, text: e.content, place: placeName(e.stop_id) }))
        : []
    };
    y.empty = !y.seasons.length && !y.trips.length && !y.dreams.length && !y.moments.length && !y.harvests.length && !y.journal.length;
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
    if (y.moments.length) {
      out.push("### Memories", "");
      y.moments.forEach(m => {
        out.push(`**${m.title}** — ${niceDate(m.date)}${m.place ? ` · ${m.place}` : ""}`);
        if (m.text) out.push("", m.text);
        out.push("");
      });
    }
    if (y.harvests.length) {
      out.push("### From my harvests", "");
      y.harvests.forEach(h => out.push(`> ${h.note}`, `> — week of ${niceDate(h.week)}`, ""));
    }
    if (y.journal.length) {
      out.push("### From my journal", "");
      y.journal.forEach(j => out.push(`*${niceDate(j.date)}${j.place ? ` · ${j.place}` : ""}*`, "", j.text, ""));
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
