import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Globe2, Image as ImageIcon, MapPin, Star, Wheat, X } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { placesInYear, yearSummary } from "../../lib/years";
import { easeOut } from "../ui/motion";
import { seasonTo } from "../../lib/seasonRange";

const EverywhereMap = lazy(() => import("../wandering/EverywhereMap"));

const niceDay = k => new Date(k + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "long" });
const yearOf = k => (k ? Number(k.slice(0, 4)) : null);

// A year with no photos of its own (Cassidy, Nov 5): one of four warm
// dusks, chosen by the year so each feels its own, under the painted
// backdrop once it's added (design/chatgpt-prompts/years-backdrop.md).
const DUSKS = [
  "linear-gradient(150deg, #9C5A3C 0%, #5E3426 55%, #2A1712 100%)",
  "linear-gradient(150deg, #5F7350 0%, #34452E 55%, #182116 100%)",
  "linear-gradient(150deg, #8A5A78 0%, #4D3047 55%, #22141F 100%)",
  "linear-gradient(150deg, #A07B3C 0%, #5C4422 55%, #2A1F10 100%)"
];
export const yearDusk = year => DUSKS[((year % DUSKS.length) + DUSKS.length) % DUSKS.length];
export const BACKDROP_WIDE = "/images/journey/year-backdrop-wide.webp";
export const BACKDROP_TALL = "/images/journey/year-backdrop-tall.webp";

// An image that quietly steps aside if it isn't there (yet).
export function Backdrop({ src, className }) {
  return <img src={src} alt="" aria-hidden="true" onError={e => { e.currentTarget.style.display = "none"; }} className={className} />;
}

// The photo that stands for a year: the first memory photo kept that year.
export function yearCover(year, moments) {
  const m = moments
    .filter(x => yearOf(x.moment_date) === year && (x.photo_thumbs?.[0] || x.photo_url))
    .sort((a, b) => (a.moment_date > b.moment_date ? 1 : -1))[0];
  return m ? m.photo_thumbs?.[0] || m.photo_url : null;
}

// One year of your life, told as a story to tap through (Cassidy, Nov 5:
// "much more neater and experiential"): the year, where it took you, the
// memories you kept, what it held, and your own words from its harvests.
// Only what's already kept; nothing is generated.
export default function YearStory({ year, onClose }) {
  const data = useAppData();
  const reduce = useReducedMotion();
  const { moments, seasons = [], highlights = [] } = data;
  const [step, setStep] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);

  const story = useMemo(() => {
    const places = placesInYear(year, data);
    const summary = yearSummary(year, data);
    const keptMoments = moments.filter(m => yearOf(m.moment_date) === year).sort((a, b) => (a.moment_date > b.moment_date ? 1 : -1));
    // In your own words (Cassidy, Nov 5): the lines kept from the YOUrnal
    // and the harvest notes, by date; at most six, spread through the year.
    const kept = highlights
      .map(h => ({ kind: "words", date: h.entry_date || (h.created_at || "").slice(0, 10), text: (h.text || "").trim() }))
      .filter(h => h.text && yearOf(h.date) === year);
    const harvested = summary.harvests
      .filter(h => (h.note || "").trim())
      .map(h => ({ kind: "harvest", date: h.week_start, text: h.note.trim() }));
    const all = [...kept, ...harvested].sort((a, b) => a.date.localeCompare(b.date));
    const notes = all.length <= 6 ? all : Array.from({ length: 6 }, (_, i) => all[Math.round((i * (all.length - 1)) / 5)]);
    const read = seasons.filter(s => yearOf(seasonTo(s.based_on || {}) || s.created_at?.slice(0, 10)) === year);
    return { places, summary, kept: keptMoments, notes, read, cover: yearCover(year, moments) };
  }, [year, data, moments, seasons, highlights]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  });

  const { places, summary, kept, notes, read, cover } = story;
  const isThisYear = year === new Date().getFullYear();

  const slides = [
    // The year itself
    <div key="year" className="text-center">
      <div className="text-label uppercase tracking-[0.24em] text-white/75">{isThisYear ? "This year, so far" : "A year in your life"}</div>
      <h1 className="font-serif text-[76px] leading-none m-0 mt-3">{year}</h1>
      <p className="text-body text-white/85 mt-5 max-w-[30ch] mx-auto">
        {[
          places.placeCount ? `${places.placeCount} ${places.placeCount === 1 ? "place" : "places"}` : null,
          summary.moments ? `${summary.moments} ${summary.moments === 1 ? "memory" : "memories"}` : null,
          summary.entries ? `${summary.entries} YOUrnal ${summary.entries === 1 ? "entry" : "entries"}` : null
        ].filter(Boolean).join(" · ") || "A quiet year in YOU."}
      </p>
      {read[0] && <p className="font-serif italic text-[20px] text-[#F3DE9C] mt-4">{read[0].name}</p>}
    </div>,

    // Where it took you
    places.trips.length > 0 && (
      <div key="places">
        <Kicker icon={MapPin}>Where it took you</Kicker>
        <h2 className="font-serif text-[34px] leading-tight m-0">
          {places.countries.length ? places.countries.join(", ") : `${places.placeCount} places`}
        </h2>
        <ul className="list-none m-0 p-0 mt-5 space-y-3">
          {places.trips.map(t => (
            <li key={t.wandering.id} className="rounded-sm bg-black/25 p-3">
              <div className="font-serif text-[20px]">{t.wandering.title}</div>
              <div className="text-bodySm text-white/80">{t.places.map(p => p.stop.place_name).join(" · ")}</div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setMapOpen(true)} className="mt-4 inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-white/15 text-bodySm">
          <Globe2 size={16} strokeWidth={1.75} /> See {year} on the world map
        </button>
      </div>
    ),

    // The memories kept
    kept.length > 0 && (
      <div key="memories">
        <Kicker icon={ImageIcon}>What you kept</Kicker>
        <div className="space-y-6 mt-2">
          {kept.map(m => (
            <figure key={m.id} className="m-0">
              {(m.photo_thumbs?.[0] || m.photo_url) && (
                <img src={m.photo_thumbs?.[0] || m.photo_url} alt="" className="w-full max-h-[46vh] object-cover rounded-card shadow-card" />
              )}
              <figcaption className="mt-2">
                <div className="font-serif text-[24px] leading-tight">{m.title}</div>
                <div className="text-caption text-white/70">{niceDay(m.moment_date)}</div>
                {m.description && <p className="text-bodySm text-white/85 m-0 mt-1">{m.description}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    ),

    // What the year held
    <div key="held">
      <Kicker icon={Star}>What {year} held</Kicker>
      <div className="space-y-4 mt-3">
        <Big n={summary.moments} label={summary.moments === 1 ? "memory kept" : "memories kept"} />
        <Big n={summary.entries} label={summary.entries === 1 ? "YOUrnal entry" : "YOUrnal entries"} />
        <Big n={summary.harvests.length} label={summary.harvests.length === 1 ? "week harvested" : "weeks harvested"} />
        {summary.dreams.length > 0 && (
          <div>
            <div className="font-serif text-[22px] text-[#F3DE9C]">Dreams you lived</div>
            <div className="text-body text-white/90">{summary.dreams.join(" · ")}</div>
          </div>
        )}
        {read.length > 0 && (
          <div>
            <div className="font-serif text-[22px] text-[#F3DE9C]">Seasons you read</div>
            <div className="text-body text-white/90">{read.map(s => s.name).join(" · ")}</div>
          </div>
        )}
      </div>
    </div>,

    // In your own words
    notes.length > 0 && (
      <div key="words">
        <Kicker icon={Wheat}>In your own words</Kicker>
        <div className="space-y-4 mt-3">
          {notes.map(n => (
            <blockquote key={n.kind + n.date + n.text.slice(0, 20)} className="m-0 border-l-2 border-[#F3DE9C] pl-3">
              <p className="font-serif italic text-[20px] leading-snug m-0">“{n.text}”</p>
              <div className="text-caption text-white/65 mt-1">
                {n.kind === "harvest" ? `From your harvest · week of ${niceDay(n.date)}` : `From your YOUrnal · ${niceDay(n.date)}`}
              </div>
            </blockquote>
          ))}
        </div>
      </div>
    ),

    // The end of the year's story
    <div key="end" className="text-center">
      <BookOpen size={32} strokeWidth={1.5} className="mx-auto opacity-90" />
      <p className="font-serif text-[28px] leading-snug mt-4 max-w-[22ch] mx-auto">
        {isThisYear ? "The rest of this year is still being written." : `That was ${year}, as you kept it.`}
      </p>
    </div>
  ].filter(Boolean);

  const last = step === slides.length - 1;
  function go(d) {
    setStep(n => Math.max(0, Math.min(slides.length - 1, n + d)));
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] text-white font-sans" role="dialog" aria-modal="true" aria-label={`${year}, a year in your life`}>
      {/* The year's own photo behind it all, softened; a night sky when there's none */}
      <div className="absolute inset-0" style={{ background: yearDusk(year) }} />
      {cover
        ? <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45 blur-[2px] scale-105" />
        : <Backdrop src={BACKDROP_TALL} className="absolute inset-0 w-full h-full object-cover opacity-70" />}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/70" />

      <div className="relative h-full max-w-[560px] mx-auto flex flex-col px-6" style={{ paddingTop: "max(env(safe-area-inset-top), 14px)", paddingBottom: "max(env(safe-area-inset-bottom), 18px)" }}>
        <div className="flex gap-1.5 mb-3" aria-hidden="true">
          {slides.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-white/90" : "bg-white/25"}`} />)}
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center bg-black/25">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex items-center py-4">
          <motion.div
            key={step}
            className="w-full"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeOut }}
          >
            {slides[step]}
          </motion.div>
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => go(-1)} aria-label="Back" className="w-12 min-h-[50px] rounded-full bg-black/25 flex items-center justify-center">
              <ArrowLeft size={18} strokeWidth={1.75} />
            </button>
          )}
          {last ? (
            <button type="button" onClick={onClose} className="flex-1 min-h-[50px] rounded-full bg-white/90 text-[#24183A] font-medium">Back to your years</button>
          ) : (
            <button type="button" onClick={() => go(1)} className="flex-1 min-h-[50px] rounded-full bg-white/90 text-[#24183A] font-medium inline-flex items-center justify-center gap-2">
              {step === 0 ? "Begin" : "Next"} <ArrowRight size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {mapOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-[70]" style={{ background: "#07071A" }} />}>
          <EverywhereMap year={year} onClose={() => setMapOpen(false)} />
        </Suspense>
      )}
    </div>,
    document.body
  );
}

function Kicker({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 text-label uppercase tracking-[0.2em] text-white/75 mb-2">
      <Icon size={13} strokeWidth={1.75} aria-hidden="true" /> {children}
    </div>
  );
}

function Big({ n, label }) {
  if (!n) return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-serif text-[44px] leading-none">{n || 0}</span>
      <span className="text-body text-white/85">{label}</span>
    </div>
  );
}
