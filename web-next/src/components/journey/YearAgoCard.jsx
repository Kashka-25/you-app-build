import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Wheat, BookOpen } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { localDateKey, addDaysKey } from "../../lib/week";
import { isExact, stopEnd } from "../../lib/wandering";
import { PhotoCarousel } from "../ui/PhotoCarousel";

const niceDay = k => new Date(k + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

// This week, a year ago (Cassidy, Nov 5: the Mirror folded into YOUrney).
// A seven-day window around today's date last year: where you were, the
// memories, YOUrnal entries and harvest notes from then. Only what was
// already kept; shown only when there's something to show.
export default function YearAgoCard() {
  const { moments, journalEntries, weekHarvests, wanderings, wanderingStops } = useAppData();

  const ago = useMemo(() => {
    const today = localDateKey();
    const center = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`;
    const from = addDaysKey(center, -3), to = addDaysKey(center, 3);
    const within = k => k && k >= from && k <= to;
    return {
      from, to,
      moments: moments.filter(m => within(m.moment_date)),
      entries: journalEntries.filter(e => within(e.entry_date)),
      harvests: weekHarvests.filter(h => (h.note || "").trim() && within(h.week_start)),
      // Exact stops covering the window (approximate ones can't be placed in a week).
      places: wanderingStops
        .filter(s => isExact(s) && s.arrive && s.arrive <= to && stopEnd(s) >= from)
        .map(s => ({ stop: s, wandering: wanderings.find(w => w.id === s.wandering_id) }))
        .filter(p => p.wandering)
    };
  }, [moments, journalEntries, weekHarvests, wanderings, wanderingStops]);

  if (!ago.moments.length && !ago.entries.length && !ago.harvests.length && !ago.places.length) return null;

  return (
    <section aria-labelledby="year-ago-title" className="rounded-card bg-surface1 shadow-card p-4 mb-4" style={{ borderLeft: "3px solid color-mix(in srgb, var(--gold) 70%, transparent)" }}>
      <h3 id="year-ago-title" className="font-serif text-h3 text-textPrimary m-0">This week, a year ago</h3>
      <div className="text-caption text-textMuted mb-3">{niceDay(ago.from)} – {niceDay(ago.to)}</div>
      <div className="space-y-3">
        {ago.places.map(({ stop, wandering }) => (
          <Link key={stop.id} to={`/wandering/${wandering.id}`} className="flex items-center gap-2 text-bodySm text-textPrimary">
            <MapPin size={14} strokeWidth={1.75} className="text-forestAccent flex-none" /> You were in <span className="font-medium">{stop.place_name}</span> · {wandering.title}
          </Link>
        ))}
        {ago.moments.map(m => (
          <div key={m.id}>
            {(m.photo_urls || []).length > 0 && <PhotoCarousel urls={m.photo_urls} thumbs={m.photo_thumbs} className="h-36 mb-1.5" />}
            <div className="font-serif text-body text-textPrimary">{m.title}</div>
            {m.description && <div className="text-bodySm text-textSecondary line-clamp-3">{m.description}</div>}
          </div>
        ))}
        {ago.entries.map(e => (
          <Link key={e.id} to="/reflections" state={{ openEntry: e.id }} className="block border-l-2 border-borderC pl-2.5">
            <div className="flex items-center gap-1 text-caption text-textMuted"><BookOpen size={11} strokeWidth={1.75} /> YOUrnal · {niceDay(e.entry_date)}</div>
            <div className="text-bodySm text-textPrimary line-clamp-3 whitespace-pre-wrap">{e.content}</div>
          </Link>
        ))}
        {ago.harvests.map(h => (
          <div key={h.week_start} className="border-l-2 border-gold pl-2.5">
            <div className="flex items-center gap-1 text-caption text-textMuted"><Wheat size={11} strokeWidth={1.75} /> Harvest · week of {niceDay(h.week_start)}</div>
            <div className="text-bodySm italic text-textPrimary">{h.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
