import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { PILLAR_COLORS } from "../../constants/app.const";
import { minutesLabel } from "../../lib/focus";
import { useEscape } from "../ui/useEscape";
import { GardenBloom, GardenSeed } from "./FocusFlower";
import Memento from "./Memento";

// A small gold spark above a flower that carries a memento.
export function MementoSpark({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle r={4.5 * scale} fill="#C9A24D" opacity={0.25} />
      <path d={`M0 ${-3 * scale} L${0.8 * scale} ${-0.8 * scale} L${3 * scale} 0 L${0.8 * scale} ${0.8 * scale} L0 ${3 * scale} L${-0.8 * scale} ${0.8 * scale} L${-3 * scale} 0 L${-0.8 * scale} ${-0.8 * scale} Z`} fill="#E8C877" />
    </g>
  );
}

// Where each focus session grows around the Tree: oldest closest to the
// trunk, the garden spreading outward (left, right, left…) as it grows,
// then filling rows further back. Deterministic, so a flower never moves.
export function gardenLayout(sessions, { trunkX, groundY, width, startGap = 118, spacing = 17, perRow = 16, rows = 4 }) {
  const oldestFirst = [...sessions].sort((a, b) => new Date(a.ended_at) - new Date(b.ended_at));
  const shown = oldestFirst.slice(-perRow * 2 * rows);
  const groundAt = x => groundY - 52 * (x / width) * (1 - x / width);
  return shown.map((s, i) => {
    const row = Math.floor(i / (perRow * 2));
    const k = i % (perRow * 2);
    const side = k % 2 === 0 ? -1 : 1;
    const step = Math.floor(k / 2);
    const jitter = ((s.id.charCodeAt(0) + s.id.charCodeAt(1)) % 7) - 3;
    const x = trunkX + side * (startGap + row * 8 + step * spacing) + jitter;
    const y = groundAt(x) + 4 + row * 12;
    return { s, x, y, scale: 1.6 - row * 0.2, opacity: 1 - row * 0.15 };
  });
}

function monthLabel(key) {
  return new Date(key + "-01T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function niceDay(dateKey) {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// The garden, up close: every session, month by month, newest first. Tap a
// flower to see what it was.
export default function GardenOfYou({ open, sessions, onClose }) {
  const [picked, setPicked] = useState(null);
  useEscape(open, () => (picked ? setPicked(null) : onClose()));

  const months = useMemo(() => {
    const by = {};
    [...sessions].sort((a, b) => new Date(b.ended_at) - new Date(a.ended_at)).forEach(s => {
      const k = s.date_key.slice(0, 7);
      (by[k] = by[k] || []).push(s);
    });
    return Object.entries(by);
  }, [sessions]);

  const blooms = sessions.filter(s => s.outcome === "bloom").length;
  const total = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto text-[#F7F5EF] font-sans"
          style={{ background: "linear-gradient(180deg, #0c1611 0%, #101a14 30%, #1a120b 100%)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          role="dialog" aria-modal="true" aria-label="Your garden"
        >
          <div className="max-w-[560px] mx-auto px-5 pt-6 pb-16">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="font-serif text-[30px] font-semibold m-0">Your garden</h1>
              <button onClick={onClose} aria-label="Back to the Tree" className="w-11 h-11 -mr-2.5 flex items-center justify-center">
                <X size={22} strokeWidth={1.75} className="text-[#B8B3A9]" />
              </button>
            </div>
            <p className="text-bodySm text-[#B8B3A9] mb-6 max-w-[44ch]">
              Every focus session, planted around your Tree. {blooms} {blooms === 1 ? "bloom" : "blooms"} and {sessions.length - blooms} resting {sessions.length - blooms === 1 ? "seed" : "seeds"}, {minutesLabel(total)} of focus.
            </p>

            {months.map(([key, list]) => (
              <section key={key} className="mb-7">
                <div className="text-label uppercase tracking-[0.08em] text-[#C9A24D] mb-2">{monthLabel(key)}</div>
                <div className="rounded-card px-2 pt-2 pb-3 flex flex-wrap" style={{ background: "linear-gradient(180deg, rgba(59,42,28,0.0) 0%, rgba(59,42,28,0.55) 70%, rgba(13,9,6,0.8) 100%)" }}>
                  {list.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setPicked(s)}
                      aria-label={`${s.outcome === "bloom" ? "A bloom" : "A resting seed"}: ${s.label}, ${niceDay(s.date_key)}${(s.mementos || []).length ? ", with a memento" : ""}`}
                      className={`w-11 h-14 flex items-end justify-center rounded-sm ${picked?.id === s.id ? "bg-white/10" : ""}`}
                    >
                      <svg viewBox="0 0 40 56" className="w-10 h-14" aria-hidden="true">
                        {s.outcome === "bloom"
                          ? <GardenBloom x={20} y={52} color={PILLAR_COLORS[s.pillar] || "#C9A24D"} scale={1.55} />
                          : <GardenSeed x={20} y={52} scale={2} />}
                        {(s.mementos || []).length > 0 && <MementoSpark x={31} y={s.outcome === "bloom" ? 8 : 36} />}
                      </svg>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <AnimatePresence>
            {picked && (
              <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed left-0 right-0 bottom-0 z-10 px-4 pb-5"
              >
                <div className="max-w-[520px] mx-auto rounded-card p-4 shadow-cardDark" style={{ background: "#141816", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-caption uppercase tracking-[0.06em]" style={{ color: PILLAR_COLORS[picked.pillar] || "#C9A24D" }}>
                        {picked.outcome === "bloom" ? "A bloom" : "A resting seed"}{picked.pillar ? ` · ${picked.pillar}` : ""}
                      </div>
                      <div className="font-serif text-[22px] font-semibold leading-tight mt-0.5">{picked.label}</div>
                      <div className="text-bodySm text-[#B8B3A9] mt-0.5">
                        {niceDay(picked.date_key)} · {picked.minutes ? minutesLabel(picked.minutes) : "a few moments"}
                        {picked.value_name ? ` · ${picked.value_name}` : ""}
                      </div>
                      {picked.note && <div className="font-serif italic text-[18px] text-[#EDE6D6] mt-2">“{picked.note}”</div>}
                      {(picked.mementos || []).length > 0 && (
                        <div className="flex flex-col gap-2 mt-3">
                          {picked.mementos.map(m => <Memento key={`${picked.id}-${m.hour}`} memento={m} />)}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setPicked(null)} aria-label="Close" className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center flex-none">
                      <X size={18} strokeWidth={1.75} className="text-[#B8B3A9]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
