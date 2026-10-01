import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, MapPin, BookOpen } from "lucide-react";
import { useAppData } from "../../../lib/AppDataContext";
import { niceDay, wanderingRange } from "../../../lib/wandering";
import { Modal } from "../../ui/Modal";
import { TWINKLE_CSS, PATTERNS, twinkle } from "./twinkle";

// Life Constellations — memories as stars over the places they happened.
// Every Wandering with memories pinned to it becomes a constellation whose
// shape is the real route: its stops are projected from their coordinates,
// joined in travel order. A stop shines brighter the more is remembered
// there; stops with nothing remembered stay faint, holding the shape.
// The sky twinkles the way a real one does (shared with The Story of You):
// irregular, brighter stars shimmering more, still under reduced motion.

const BOX_W = 160, BOX_H = 120, PAD = 14;

function rangeLabel(stops) {
  const r = wanderingRange(stops);
  if (!r) return "";
  return `${niceDay(r.start, { month: "short", year: "numeric" })}${r.end.slice(0, 7) !== r.start.slice(0, 7) ? ` – ${niceDay(r.end, { month: "short", year: "numeric" })}` : ""}`;
}

// Projects a Wandering's stops into its own little box, keeping the true
// shape (longitude scaled by latitude so places far from the equator
// aren't stretched sideways).
function projectStops(stops) {
  if (!stops.length) return [];
  const meanLat = stops.reduce((s, p) => s + p.lat, 0) / stops.length;
  const k = Math.cos((meanLat * Math.PI) / 180);
  const pts = stops.map(s => ({ x: s.lng * k, y: -s.lat }));
  const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
  const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
  const spanX = maxX - minX, spanY = maxY - minY;
  const scale = Math.min((BOX_W - PAD * 2) / (spanX || 1), (BOX_H - PAD * 2) / (spanY || 1));
  const offX = (BOX_W - spanX * (spanX ? scale : 0)) / 2;
  const offY = (BOX_H - spanY * (spanY ? scale : 0)) / 2;
  return pts.map((p, i) => ({
    stop: stops[i],
    x: spanX ? offX + (p.x - minX) * scale : BOX_W / 2,
    y: spanY ? offY + (p.y - minY) * scale : BOX_H / 2
  }));
}

function Constellation({ wandering, points, counts, total, onStar }) {
  const line = points.map(p => `${p.x},${p.y}`).join(" ");
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${BOX_W} ${BOX_H}`} className="w-full max-w-[220px] h-auto overflow-visible" role="group" aria-label={`${wandering.title} constellation`}>
        {points.length > 1 && <polyline points={line} fill="none" stroke="#EDE6D6" strokeOpacity={0.28} strokeWidth={0.8} />}
        {points.map(p => {
          const n = counts[p.stop.id] || 0;
          const seed = p.stop.id.charCodeAt(0) + p.stop.id.charCodeAt(1);
          if (!n) {
            return (
              <circle
                key={p.stop.id} className="sboy-tw" cx={p.x} cy={p.y} r={1.4} fill="#EDE6D6"
                style={twinkle(0.4, 0.05, 6 + (seed % 4), seed % 5, PATTERNS[seed % 3])}
              />
            );
          }
          const r = 2.4 + Math.min(n, 5) * 0.7;
          return (
            <g
              key={p.stop.id}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${p.stop.place_name}: ${n} ${n === 1 ? "memory" : "memories"}`}
              onClick={() => onStar(p.stop)}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && onStar(p.stop)}
            >
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
              <circle cx={p.x} cy={p.y} r={r * 3} fill="#C9A24D" opacity={0.18} style={{ filter: "blur(4px)" }} />
              {/* A calm glimmer: a remembered place should feel steady. */}
              <circle
                className="sboy-tw" cx={p.x} cy={p.y} r={r} fill="#F7F1E1"
                style={twinkle(1, 0.08, 5 + (seed % 3), seed % 6, PATTERNS[seed % 3])}
              />
              <text x={p.x} y={p.y - r - 5} textAnchor="middle" fontSize="7.5" fill="#EDE6D6" opacity={0.75} fontFamily="DM Sans, sans-serif">
                {p.stop.place_name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-center mt-1">
        <div className="font-serif text-h3 text-cream">{wandering.title}</div>
        <div className="text-caption" style={{ color: "#8B8E87" }}>
          {rangeLabel(points.map(p => p.stop))}{rangeLabel(points.map(p => p.stop)) ? " · " : ""}
          {total} {total === 1 ? "memory" : "memories"}
        </div>
      </div>
    </div>
  );
}

export default function LifeConstellations({ onClose }) {
  const { wanderings, wanderingStops, moments, journalEntries } = useAppData();
  const [openStop, setOpenStop] = useState(null);

  // Memories by stop: moments and journal entries alike.
  const memoriesByStop = useMemo(() => {
    const map = {};
    const add = (stopId, m) => { (map[stopId] = map[stopId] || []).push(m); };
    moments.filter(m => m.stop_id).forEach(m => add(m.stop_id, {
      kind: "moment", id: m.id, date: m.moment_date, title: m.title, text: m.description, photo: m.photo_url
    }));
    journalEntries.filter(e => e.stop_id).forEach(e => add(e.stop_id, {
      kind: "entry", id: e.id, date: e.entry_date, title: null, text: e.content, photo: null
    }));
    Object.values(map).forEach(list => list.sort((a, b) => (a.date > b.date ? 1 : -1)));
    return map;
  }, [moments, journalEntries]);

  const constellations = useMemo(() => wanderings
    .map(w => {
      const stops = wanderingStops.filter(s => s.wandering_id === w.id).sort((a, b) => a.position - b.position);
      const counts = Object.fromEntries(stops.map(s => [s.id, (memoriesByStop[s.id] || []).length]));
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { wandering: w, points: projectStops(stops), counts, total, start: stops.map(s => s.arrive).filter(Boolean).sort()[0] || "" };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => (a.start > b.start ? 1 : -1)),
  [wanderings, wanderingStops, memoriesByStop]);

  // A fixed scatter of faint background stars (seeded, so it never shifts).
  const bgStars = useMemo(() => {
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: 140 }, () => {
      const r = 0.4 + rand() * 0.9;
      const bright = r > 1.15;
      // The few brighter stars sit higher so their shimmer actually reads.
      const o = bright ? 0.6 + rand() * 0.3 : 0.12 + rand() * 0.35;
      const duration = bright ? 2.6 + rand() * 2 : 4 + rand() * 5;
      return {
        x: rand() * 100, y: rand() * 100, r,
        tw: twinkle(o, bright ? 0.4 : r > 0.8 ? 0.2 : 0.07, +duration.toFixed(2), +(rand() * duration).toFixed(2), PATTERNS[Math.floor(rand() * 3)])
      };
    });
  }, []);

  const stopMemories = openStop ? memoriesByStop[openStop.id] || [] : [];
  const openWandering = openStop && wanderings.find(w => w.id === openStop.wandering_id);

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: "radial-gradient(120% 90% at 50% 0%, #10202a 0%, #0a1218 45%, #050809 100%)" }}>
      <svg className="fixed inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {bgStars.map((s, i) => <circle key={i} className="sboy-tw" cx={s.x} cy={s.y} r={s.r * 0.12} fill="#EDE6D6" style={s.tw} />)}
      </svg>

      <style>{TWINKLE_CSS}</style>
      <div className="relative px-5 pt-6 pb-16 max-w-[640px] mx-auto">
        <button onClick={onClose} className="flex items-center gap-1.5 text-caption uppercase tracking-wide mb-5" style={{ color: "#8B8E87" }}>
          <X size={14} strokeWidth={1.75} /> Back to the tree
        </button>

        <div className="text-center mb-8">
          <div className="text-caption uppercase tracking-wide text-gold mb-1">Memories over places</div>
          <div className="font-serif text-h2 font-medium text-cream">Life Constellations</div>
          <p className="text-bodySm max-w-[42ch] mx-auto mt-1" style={{ color: "#B8B3A9" }}>
            Every wandering you remember becomes a constellation, drawn in the true shape of the way you went.
            The brighter the star, the more you carried home from there.
          </p>
        </div>

        {constellations.length === 0 ? (
          <div className="text-center px-6 mt-16">
            <div className="font-serif text-h3 text-cream mb-1.5">No constellations yet</div>
            <p className="text-bodySm mb-3 max-w-[36ch] mx-auto" style={{ color: "#B8B3A9" }}>
              Plan a wandering from one of your Dreams, then pin memories to its stops. Each place you remember becomes a star here.
            </p>
            <Link to="/pursue" className="text-bodySm underline" style={{ color: "var(--gold)" }}>Go to your Dreams →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
            {constellations.map(c => (
              <Constellation key={c.wandering.id} {...c} onStar={setOpenStop} />
            ))}
          </div>
        )}
      </div>

      <Modal open={Boolean(openStop)} title={openStop?.place_name || ""} onClose={() => setOpenStop(null)}>
        {openStop && (
          <>
            <div className="flex items-center gap-1.5 text-caption text-textMuted mb-3">
              <MapPin size={12} strokeWidth={1.75} />
              {[openStop.place_detail, openWandering?.title].filter(Boolean).join(" · ")}
            </div>
            <div className="space-y-3">
              {stopMemories.map(m => (
                <div key={m.kind + m.id} className="rounded-card bg-surface1 p-3">
                  {m.photo && <img src={m.photo} alt="" className="w-full h-40 object-cover rounded-sm mb-2" />}
                  <div className="flex items-center gap-1.5 text-caption text-textMuted mb-0.5">
                    {m.kind === "entry" && <BookOpen size={12} strokeWidth={1.75} />}
                    {niceDay(m.date)}
                  </div>
                  {m.title && <div className="font-serif text-h3 text-textPrimary">{m.title}</div>}
                  {m.text && <div className={`text-bodySm text-textSecondary whitespace-pre-wrap ${m.kind === "entry" ? "line-clamp-6" : ""}`}>{m.text}</div>}
                </div>
              ))}
            </div>
            {openWandering && (
              <Link to={`/wandering/${openWandering.id}`} className="inline-block mt-4 text-bodySm underline" style={{ color: "var(--forest-accent)" }}>
                Open the wandering →
              </Link>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
