import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Wheat, Star, BookOpen, Image as ImageIcon, MapPin } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { localDateKey, addDaysKey } from "../../lib/week";
import { isExact, stopEnd } from "../../lib/wandering";
import { yearSummary } from "../../lib/years";
import { BackRow, SectionTitle } from "../Primitives";
import YearInPlaces from "../wandering/YearInPlaces";

const niceDay = k => new Date(k + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

function Card({ children }) {
  return <section className="rounded-card bg-surface1 shadow-card p-4 mb-4">{children}</section>;
}
function Label({ children }) {
  return <div className="text-label uppercase text-textMuted mb-1.5">{children}</div>;
}

// The Mirror — this year so far, and the same week one year ago, held up to
// the light. Only ever what's already recorded; nothing is generated here.
export default function Mirror() {
  const data = useAppData();
  const { loaded, moments, journalEntries, weekHarvests, wanderings, wanderingStops, currentSeason } = data;
  const thisYear = new Date().getFullYear();
  const summary = yearSummary(thisYear, data);

  // One year ago this week: a seven-day window around today's date last year.
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
      // Where you were: exact stops covering the window (approximate ones
      // can't be placed in a particular week).
      places: wanderingStops
        .filter(s => isExact(s) && s.arrive && s.arrive <= to && stopEnd(s) >= from)
        .map(s => ({ stop: s, wandering: wanderings.find(w => w.id === s.wandering_id) }))
        .filter(p => p.wandering)
    };
  }, [moments, journalEntries, weekHarvests, wanderings, wanderingStops]);

  const agoEmpty = !ago.moments.length && !ago.entries.length && !ago.harvests.length && !ago.places.length;
  const latestNote = summary.harvests.find(h => (h.note || "").trim());

  if (!loaded) return <div className="pt-8 px-5 text-body text-textSecondary">Holding up the mirror…</div>;

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>The Mirror</SectionTitle>
      <p className="text-bodySm text-textSecondary -mt-1 mb-5">
        This year so far, and this same week a year ago. Only what you've already lived and kept.
      </p>

      <div className="font-serif text-h2 text-textPrimary mb-2.5">{thisYear} so far</div>

      <Card>
        <YearInPlaces year={thisYear} />
      </Card>

      <Card>
        <Label>What the year has held</Label>
        <div className="space-y-1.5 text-bodySm text-textPrimary">
          {currentSeason && (
            <div className="flex items-center gap-2"><Wheat size={14} strokeWidth={1.75} className="text-gold" /> You're in your <span className="font-serif text-h3 text-gold">{currentSeason.name}</span></div>
          )}
          <div className="flex items-center gap-2"><ImageIcon size={14} strokeWidth={1.75} className="text-textMuted" /> {summary.moments} {summary.moments === 1 ? "memory" : "memories"} kept</div>
          <div className="flex items-center gap-2"><BookOpen size={14} strokeWidth={1.75} className="text-textMuted" /> {summary.entries} journal {summary.entries === 1 ? "entry" : "entries"}</div>
          <div className="flex items-center gap-2"><Wheat size={14} strokeWidth={1.75} className="text-textMuted" /> {summary.harvests.length} {summary.harvests.length === 1 ? "harvest" : "harvests"} gathered</div>
          {summary.dreams.length > 0 && (
            <div className="flex items-start gap-2">
              <Star size={14} strokeWidth={1.75} className="text-gold mt-0.5 flex-none" />
              <span>{summary.dreams.length} {summary.dreams.length === 1 ? "dream" : "dreams"} lived: {summary.dreams.join(" · ")}</span>
            </div>
          )}
        </div>
        {latestNote && (
          <div className="mt-3 border-l-2 border-gold pl-2.5">
            <div className="text-caption text-textMuted">From your latest harvest</div>
            <div className="text-bodySm italic text-textPrimary">{latestNote.note}</div>
          </div>
        )}
      </Card>

      <div className="font-serif text-h2 text-textPrimary mt-6 mb-0.5">One year ago</div>
      <div className="text-caption text-textMuted mb-2.5">{niceDay(ago.from)} – {niceDay(ago.to)}</div>

      <Card>
        {agoEmpty ? (
          <p className="text-bodySm text-textSecondary">
            Nothing was kept from this week a year ago. Next year, this is where today will come back to you.
          </p>
        ) : (
          <div className="space-y-3">
            {ago.places.map(({ stop, wandering }) => (
              <Link key={stop.id} to={`/wandering/${wandering.id}`} className="flex items-center gap-2 text-bodySm text-textPrimary">
                <MapPin size={14} strokeWidth={1.75} className="text-forestAccent" /> You were in <span className="font-medium">{stop.place_name}</span> · {wandering.title}
              </Link>
            ))}
            {ago.moments.map(m => (
              <div key={m.id}>
                {m.photo_url && <img src={m.photo_url} alt="" className="w-full h-36 object-cover rounded-sm mb-1.5" />}
                <div className="font-serif text-h3 text-textPrimary">{m.title}</div>
                <div className="text-caption text-textMuted">{niceDay(m.moment_date)}</div>
                {m.description && <div className="text-bodySm text-textSecondary">{m.description}</div>}
              </div>
            ))}
            {ago.entries.map(e => (
              <div key={e.id} className="border-l-2 border-borderC pl-2.5">
                <div className="text-caption text-textMuted">Journal · {niceDay(e.entry_date)}</div>
                <div className="text-bodySm text-textPrimary line-clamp-4 whitespace-pre-wrap">{e.content}</div>
              </div>
            ))}
            {ago.harvests.map(h => (
              <div key={h.week_start} className="border-l-2 border-gold pl-2.5">
                <div className="text-caption text-textMuted">Harvest · week of {niceDay(h.week_start)}</div>
                <div className="text-bodySm italic text-textPrimary">{h.note}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Link to="/legacy" className="text-bodySm text-forestAccent underline underline-offset-2">See every year in Legacy →</Link>
    </div>
  );
}
