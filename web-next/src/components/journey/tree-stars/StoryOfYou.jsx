import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAppData } from "../../../lib/AppDataContext";
import { pickCurrentChapter } from "../../../lib/compass";
import { Modal } from "../../ui/Modal";

// Portrait-shaped viewBox (not the Tree scene's wide landscape one) — this
// fills the entire screen edge to edge via preserveAspectRatio="slice", so
// it needs to already read as a tall sky, not a wide banner cropped down.
const SVG_W = 400, SVG_H = 900;
const BAND_ANGLE = -14, BAND_CX = SVG_W / 2, BAND_CY = SVG_H * 0.5;
const ERA_COLORS = ["#7c5cbf", "#4a8fa0", "#b3607a", "#7a9b76", "#6478a0", "#a06490", "#c4783a"];

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function monthYear(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
function inRange(momentDate, start, end) {
  const d = new Date(momentDate + "T00:00:00").getTime();
  if (d < new Date(start + "T00:00:00").getTime()) return false;
  if (end && d > new Date(end + "T00:00:00").getTime()) return false;
  return true;
}

// Positions eras down a gentle vertical drift, oldest at the bottom, "now"
// near the top — x only wanders within a safe central corridor so every
// era stays on-screen even where "slice" cropping is tightest (a tall
// narrow phone).
function eraPos(i, n) {
  const t = n <= 1 ? 0.5 : i / (n - 1);
  const x = SVG_W / 2 + Math.sin(t * Math.PI * 1.6) * (SVG_W * 0.22);
  // Topmost era ("now") sits well clear of the header text block, not
  // right up against it.
  const y = SVG_H - 160 - t * (SVG_H - 380);
  return { x, y };
}

export default function StoryOfYou({ onClose }) {
  const { chapters, moments, loadEraInsights, loadEraWeeklyReflections } = useAppData();
  const [openIndex, setOpenIndex] = useState(null);
  const [eraData, setEraData] = useState({}); // chapterId -> { loading, insights, weekly }

  const eras = useMemo(
    () => [...chapters].sort((a, b) => new Date(a.range_start) - new Date(b.range_start)),
    [chapters]
  );
  const currentChapter = pickCurrentChapter(chapters);

  const positions = useMemo(() => eras.map((_, i) => eraPos(i, eras.length)), [eras]);

  const bgStars = useMemo(() => Array.from({ length: 90 }, () => ({
    x: Math.random() * SVG_W, y: Math.random() * SVG_H, r: Math.random() * 1 + 0.3, delay: Math.random() * 5
  })), []);

  // A dense scatter following the galaxy band's centerline (with jitter),
  // layered under the sparse uniform bgStars — the difference between "a
  // dark sky with some stars" and "the Milky Way" is this bright, busy
  // band, not just more stars everywhere.
  const milkyStars = useMemo(() => Array.from({ length: 260 }, () => {
    const t = Math.random();
    const y = t * SVG_H;
    const centerX = BAND_CX + Math.tan((BAND_ANGLE * Math.PI) / 180) * (y - BAND_CY);
    const spread = (Math.random() - 0.5) * 140 * Math.pow(Math.random(), 0.6);
    const x = Math.max(0, Math.min(SVG_W, centerX + spread));
    return { x, y, r: Math.random() * 1.3 + 0.3, delay: Math.random() * 5, bright: Math.random() > 0.92 };
  }), []);

  const openEra = chapters.length > 0 && openIndex !== null ? eras[openIndex] : null;

  useEffect(() => {
    if (!openEra) return;
    if (eraData[openEra.id]) return;
    setEraData(prev => ({ ...prev, [openEra.id]: { loading: true, insights: [], weekly: [] } }));
    Promise.all([
      loadEraInsights(openEra.range_start, openEra.range_end),
      loadEraWeeklyReflections(openEra.range_start, openEra.range_end)
    ])
      .then(([insights, weekly]) => {
        setEraData(prev => ({ ...prev, [openEra.id]: { loading: false, insights, weekly } }));
      })
      .catch(e => {
        console.error("[StoryOfYou] era detail load failed:", e);
        setEraData(prev => ({ ...prev, [openEra.id]: { loading: false, insights: [], weekly: [], error: true } }));
      });
  }, [openEra, eraData, loadEraInsights, loadEraWeeklyReflections]);

  const eraMoments = openEra ? moments.filter(m => inRange(m.moment_date, openEra.range_start, openEra.range_end)) : [];
  const detail = openEra ? eraData[openEra.id] : null;
  const patterns = detail
    ? detail.insights.flatMap(row => (row.insights || []).filter(it => it.category === "pattern" && it.status !== "rejected"))
    : [];

  return (
    <div className="fixed inset-0 overflow-hidden">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <radialGradient id="milkyBand" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#efe9ff" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#9b8fd9" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#4a3f7a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0b0a1c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse
          cx={BAND_CX} cy={BAND_CY} rx={130} ry={SVG_H * 0.62}
          fill="url(#milkyBand)" opacity={0.6}
          transform={`rotate(${BAND_ANGLE} ${BAND_CX} ${BAND_CY})`}
          style={{ filter: "blur(18px)" }}
        />

        {milkyStars.map((s, i) => (
          <circle
            key={"mw" + i} cx={s.x} cy={s.y} r={s.bright ? s.r + 0.8 : s.r} fill="#EDE6D6"
            opacity={s.bright ? 0.95 : 0.6}
            style={{ animation: `sboyTwinkle ${s.bright ? 3 : 4.5}s ease-in-out ${s.delay}s infinite` }}
          />
        ))}

        {bgStars.map((s, i) => (
          <circle
            key={i} cx={s.x} cy={s.y} r={s.r} fill="#EDE6D6"
            style={{ animation: `sboyTwinkle 4.5s ease-in-out ${s.delay}s infinite` }}
          />
        ))}

        {eras.length > 1 && (
          <path
            d={positions.reduce((d, p, i) => {
              if (i === 0) return `M ${p.x} ${p.y}`;
              const prev = positions[i - 1];
              const midY = (prev.y + p.y) / 2;
              return d + ` Q ${prev.x} ${midY}, ${p.x} ${p.y}`;
            }, "")}
            fill="none" stroke="#EDE6D6" strokeWidth={1} opacity={0.3} strokeDasharray="2 6"
          />
        )}

        {/* Eras as glowing stars within the Milky Way, not separate
            colored planets sitting on top of it — a soft tinted halo
            (per-era identity) around a bright white core, same twinkle
            family as the rest of the sky, just bigger and steadier. */}
        {eras.map((e, i) => {
          const isNow = currentChapter && e.id === currentChapter.id;
          const color = ERA_COLORS[i % ERA_COLORS.length];
          const { x, y } = positions[i];
          const r = isNow ? 8 : 5.5;
          return (
            <g key={e.id} className="cursor-pointer" onClick={() => setOpenIndex(i)}>
              <circle cx={x} cy={y} r={r * 3.4} fill={color} opacity={0.24} style={{ filter: "blur(11px)" }} />
              <circle cx={x} cy={y} r={r * 1.8} fill="#EDE6D6" opacity={0.35} style={{ filter: "blur(4px)" }} />
              <circle
                cx={x} cy={y} r={r} fill="#EDE6D6"
                style={{ animation: `sboyStarPulse ${isNow ? 2.2 : 3.6}s ease-in-out infinite` }}
              />
              <circle cx={x} cy={y} r={r * 0.5} fill={color} opacity={0.9} />
              <text x={x} y={y + r + 20} textAnchor="middle" fontSize="13" fontFamily="Cormorant Garamond, Georgia, serif" fill="#EDE6D6">
                {e.title}
              </text>
              <text x={x} y={y + r + 34} textAnchor="middle" fontSize="9.5" fill="#8B8E87">
                {monthYear(e.range_start)}{e.range_end ? " – " + monthYear(e.range_end) : " – now"}
              </text>
            </g>
          );
        })}

        <style>{`
          @keyframes sboyTwinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.55; } }
          @keyframes sboyStarPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
        `}</style>
      </svg>

      {/* pointer-events-none on the wrapper — it spans the full height so
          the empty-state can be vertically centered, but that height is
          mostly transparent space sitting on top of the SVG's own
          clickable era stars. Without this, the wrapper (not the stars
          underneath it) silently ate every click. Only the two actual
          controls opt back in with pointer-events-auto. */}
      <div className="relative z-10 h-full overflow-y-auto px-5 pt-6 pb-10 flex flex-col pointer-events-none">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-caption uppercase tracking-wide mb-5 flex-none pointer-events-auto"
          style={{ color: "#8B8E87" }}
        >
          <X size={14} strokeWidth={1.75} /> Back to the tree
        </button>

        <div className="text-center mb-3 flex-none">
          <div className="text-caption uppercase tracking-wide text-gold mb-1">Beyond the cosmos</div>
          <div className="font-serif text-h2 font-medium text-cream">The Story of You</div>
          <p className="text-bodySm text-[#B8B3A9] max-w-[42ch] mx-auto mt-1">
            Drift out past every star, until your whole life becomes a single thread of light.
            Choose an era. Open the door. Step back inside it.
          </p>
        </div>

        {eras.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pointer-events-auto">
            <div className="font-serif text-h3 text-cream mb-1.5">Your story has no eras yet</div>
            <p className="text-bodySm text-[#B8B3A9] mb-3 max-w-[36ch]">
              Eras come from your Chapters — add some memories and let YOU suggest the shape of your story so far.
            </p>
            <Link to="/journey" state={{ tab: "chapters" }} className="text-bodySm underline" style={{ color: "var(--gold)" }}>
              Go to Chapters →
            </Link>
          </div>
        )}
      </div>

      <Modal open={Boolean(openEra)} title={openEra?.title || ""} onClose={() => setOpenIndex(null)}>
        {openEra && (
          <>
            <div className="text-caption text-textMuted mb-2">
              {niceDate(openEra.range_start)} – {openEra.range_end ? niceDate(openEra.range_end) : "now"}
            </div>
            {openEra.blurb && <div className="text-bodySm text-textSecondary italic mb-4">{openEra.blurb}</div>}

            <div className="mb-4">
              <div className="text-label uppercase text-textMuted mb-1.5">Moments</div>
              {eraMoments.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {eraMoments.map(m => (
                    <span key={m.id} className="text-bodySm bg-surface3 text-textPrimary px-2.5 py-1 rounded-full">{m.title}</span>
                  ))}
                </div>
              ) : (
                <div className="text-bodySm text-textMuted">No memories logged for this era yet.</div>
              )}
            </div>

            <div className="mb-4">
              <div className="text-label uppercase text-textMuted mb-1.5">YOUnderstanding noticed</div>
              {detail?.loading ? (
                <div className="text-bodySm text-textMuted">Reading back through this era…</div>
              ) : patterns.length > 0 ? (
                <div className="space-y-1.5">
                  {patterns.slice(0, 3).map((p, i) => (
                    <div key={i} className="text-bodySm text-textPrimary border-l-2 border-forestAccent pl-2.5">{p.text}</div>
                  ))}
                </div>
              ) : (
                <div className="text-bodySm text-textMuted">Nothing noticed from this era yet.</div>
              )}
            </div>

            <div className="mb-2">
              <div className="text-label uppercase text-textMuted mb-1.5">A weekly reflection from then</div>
              {detail?.loading ? (
                <div className="text-bodySm text-textMuted">…</div>
              ) : detail?.weekly?.[0]?.sections ? (
                <div className="text-bodySm text-textPrimary border-l-2 border-forestAccent pl-2.5">
                  {detail.weekly[0].sections.what_mattered || detail.weekly[0].sections.your_week}
                </div>
              ) : (
                <div className="text-bodySm text-textMuted">No weekly reflection written during this era.</div>
              )}
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-borderC">
              <button
                onClick={() => setOpenIndex(i => Math.max(0, i - 1))}
                disabled={openIndex === 0}
                className="flex items-center gap-1 text-bodySm text-textSecondary disabled:opacity-30"
              >
                <ChevronLeft size={15} strokeWidth={1.75} /> Earlier era
              </button>
              <button
                onClick={() => setOpenIndex(i => Math.min(eras.length - 1, i + 1))}
                disabled={openIndex === eras.length - 1}
                className="flex items-center gap-1 text-bodySm text-textSecondary disabled:opacity-30"
              >
                Later era <ChevronRight size={15} strokeWidth={1.75} />
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
