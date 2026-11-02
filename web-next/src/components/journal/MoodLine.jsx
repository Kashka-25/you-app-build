import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { bandFor, moodColour, scoreOf } from "../../lib/mood";
import MoodFace from "../home/MoodFace";
import { addDaysKey, localDateKey } from "../../lib/week";

// Your moods over time (Cassidy, Nov 2): every check-in and every entry's
// mood, one point a day (the day's average), for the last two weeks, month
// or three months. The line is quiet ink; each point wears its mood's colour
// (the same warm-to-fresh scale as the faces) and its height says the same,
// so colour is never the only cue. Tap a point for that day. Folded, it's a
// tile beside Tags (Cassidy, Nov 2: "more appealing"): the face of your usual
// mood and your last seven days as dots. Open, it takes the full width.
const RANGES = [
  { days: 14, label: "2 weeks" },
  { days: 30, label: "Month" },
  { days: 90, label: "3 months" }
];
const H = 132;
// The guide labels get their own margin on the right, so the line never crosses them.
const PAD = { top: 10, right: 62, bottom: 22, left: 10 };
const GUIDES = [{ at: 10, label: "Low" }, { at: 50, label: "Steady" }, { at: 90, label: "Energised" }];

function niceDay(key, long = false) {
  return new Date(key + "T00:00:00").toLocaleDateString(undefined, long ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "short" });
}

export default function MoodLine({ onOpenEntry }) {
  const { moodLog, journalEntries } = useAppData();
  const [days, setDays] = useState(30);
  const [picked, setPicked] = useState(null);
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const today = localDateKey();
  const from = addDaysKey(today, -(days - 1));
  const points = useMemo(() => {
    const byDay = new Map();
    const add = (key, score, entry) => {
      if (!key || score == null || key < from || key > today) return;
      const d = byDay.get(key) || { key, scores: [], entry: null };
      d.scores.push(score);
      if (entry && !d.entry) d.entry = entry;
      byDay.set(key, d);
    };
    for (const m of moodLog) add(m.date_key, scoreOf(m));
    for (const e of journalEntries) add(e.entry_date, scoreOf(e), e);
    return [...byDay.values()]
      .map(d => ({ ...d, score: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) }))
      .sort((a, b) => (a.key < b.key ? -1 : 1));
  }, [moodLog, journalEntries, from, today]);

  // Fewer than two days to draw a line between: leave it until there's more.
  if (points.length < 2) return null;

  const innerW = width - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const dayIndex = key => Math.round((new Date(key + "T00:00:00") - new Date(from + "T00:00:00")) / 86400000);
  const x = key => PAD.left + (dayIndex(key) / Math.max(1, days - 1)) * innerW;
  const y = s => PAD.top + (1 - s / 100) * innerH;
  // The line breaks across a gap of more than a few days, so it never
  // suggests moods that weren't recorded.
  const segments = [];
  points.forEach((p, i) => {
    if (i === 0 || dayIndex(p.key) - dayIndex(points[i - 1].key) > 4) segments.push([p]);
    else segments[segments.length - 1].push(p);
  });
  const average = Math.round(points.reduce((a, p) => a + p.score, 0) / points.length);
  const pick = picked && points.find(p => p.key === picked);

  return (
    <section aria-labelledby="mood-line-title" className={`rounded-card bg-surface1 shadow-card ${open ? "col-span-2" : ""}`}>
      <h2 id="mood-line-title" className="m-0">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={`Your moods, mostly ${bandFor(average).label.toLowerCase()}. ${open ? "Fold away" : "Open"}`}
          className="w-full flex items-center gap-2 px-2.5 min-h-[44px] text-left font-normal"
        >
          <MoodFace score={average} size={26} />
          <span className="flex-1 min-w-0 text-bodySm text-textPrimary truncate">Your moods</span>
          <ChevronDown size={15} strokeWidth={1.75} className={`flex-none text-textMuted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h2>
      {open && (
      <div className="px-3 pb-3">
      <div className="flex justify-end">
        <div className="flex gap-1" role="group" aria-label="How far back">
          {RANGES.map(r => (
            <button
              key={r.days}
              type="button"
              onClick={() => { setDays(r.days); setPicked(null); }}
              aria-pressed={days === r.days}
              className={`min-h-[30px] px-2.5 rounded-full text-caption ${days === r.days ? "bg-surface3 text-textPrimary font-medium" : "text-textMuted hover:text-textPrimary"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-caption text-textMuted m-0 mt-1">
        Check-ins and entries, one point a day. Mostly <span className="text-textSecondary font-medium">{bandFor(average).label.toLowerCase()}</span> across {days === 14 ? "these two weeks" : days === 30 ? "this month" : "these three months"}.
      </p>

      <div ref={box} className="relative mt-2" onPointerLeave={() => setPicked(null)}>
        <svg width={width} height={H} role="img" aria-label={`Mood line, ${points.length} days with a mood, mostly ${bandFor(average).label.toLowerCase()}.`} className="block overflow-visible">
          {/* Three quiet guides: Low, Steady, Energised. */}
          {GUIDES.map(g => (
            <g key={g.at}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(g.at)} y2={y(g.at)} stroke="var(--border)" strokeWidth="1" strokeDasharray={g.at === 50 ? "0" : "2 4"} />
              <text x={width - 2} y={y(g.at) + 3} textAnchor="end" className="fill-textMuted" style={{ fontSize: 9, letterSpacing: "0.04em" }}>{g.label.toUpperCase()}</text>
            </g>
          ))}
          {/* The first and last day of the range. */}
          <text x={PAD.left} y={H - 6} className="fill-textMuted" style={{ fontSize: 10 }}>{niceDay(from)}</text>
          <text x={width - PAD.right} y={H - 6} textAnchor="end" className="fill-textMuted" style={{ fontSize: 10 }}>Today</text>

          {segments.map((seg, i) => seg.length > 1 && (
            <polyline
              key={i}
              points={seg.map(p => `${x(p.key)},${y(p.score)}`).join(" ")}
              fill="none"
              stroke="var(--text-secondary)"
              strokeOpacity="0.55"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {pick && <line x1={x(pick.key)} x2={x(pick.key)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--text-muted)" strokeWidth="1" />}
          {points.map(p => (
            <g key={p.key}>
              <circle cx={x(p.key)} cy={y(p.score)} r={pick?.key === p.key ? 6 : 4.5} fill={moodColour(p.score)} stroke="var(--surface-1)" strokeWidth="2" />
              {/* A bigger, invisible target to tap. */}
              <circle
                cx={x(p.key)} cy={y(p.score)} r="14" fill="transparent"
                onPointerEnter={() => setPicked(p.key)}
                onClick={() => setPicked(picked === p.key ? null : p.key)}
                style={{ cursor: "pointer" }}
              />
            </g>
          ))}
        </svg>

        {pick && (
          <div
            className="absolute z-10 -translate-x-1/2 rounded-sm bg-surface2 border border-borderC shadow-card px-2.5 py-1.5 text-caption text-textPrimary whitespace-nowrap pointer-events-auto"
            style={{ left: Math.min(width - 70, Math.max(70, x(pick.key))), top: Math.max(0, y(pick.score) - 54) }}
            role="status"
          >
            <div className="text-textMuted">{niceDay(pick.key, true)}</div>
            <div className="font-medium">{bandFor(pick.score).label} · {pick.score}{pick.scores.length > 1 ? ` (${pick.scores.length} moods)` : ""}</div>
            {pick.entry && onOpenEntry && (
              <button type="button" onClick={() => onOpenEntry(pick.entry)} className="text-forestAccent underline underline-offset-2">Open that day's entry</button>
            )}
          </div>
        )}
      </div>

      </div>
      )}

      {/* The same, as words, for screen readers. */}
      <ul className="sr-only">
        {points.map(p => <li key={p.key}>{niceDay(p.key, true)}: {bandFor(p.score).label}, {p.score} out of 100</li>)}
      </ul>
    </section>
  );
}
