import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAppData } from "../../lib/AppDataContext";
import { useAuth } from "../../lib/AuthContext";
import { getPillarLevel } from "../../constants/app.const";
import { useEscape } from "../ui/useEscape";
import { SunflowerHeart } from "./PillarsPanel";

// A celebration when a Pillar levels up (Cassidy, Oct 19). It answers
// something the Seeker did, so the bloom is welcome: a flower opens in the
// Pillar's colour around a sunflower heart, golden seeds drift out, and it
// says what grew. Tap anywhere (or Escape) to close. Level-ups that happened
// since the last visit are celebrated on return. With reduced motion on,
// it simply fades in, still.
//
// Levels last seen are kept per account on this device, so an old level is
// never celebrated twice and a new device starts quietly.
const seenKey = userId => `you.pillarLevels.${userId}`;

function readSeen(userId) {
  try { return JSON.parse(localStorage.getItem(seenKey(userId)) || "null"); } catch { return null; }
}
function writeSeen(userId, levels) {
  try { localStorage.setItem(seenKey(userId), JSON.stringify(levels)); } catch { /* this visit only */ }
}

export default function LevelUpCelebration() {
  const { pillars, loaded } = useAppData();
  const { userId } = useAuth();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!loaded || !userId || !pillars?.length) return;
    const now = Object.fromEntries(pillars.map(p => [p.name, getPillarLevel(p.xp).level]));
    const seen = readSeen(userId);
    writeSeen(userId, now);
    if (!seen) return; // first time on this device: start quietly
    const grown = pillars
      .filter(p => now[p.name] > (seen[p.name] ?? now[p.name]))
      .map(p => ({ name: p.name, color: p.color, level: now[p.name] }));
    if (grown.length) setQueue(q => [...q, ...grown.filter(g => !q.some(x => x.name === g.name && x.level === g.level))]);
  }, [loaded, userId, pillars]);

  const current = queue[0];
  const close = () => setQueue(q => q.slice(1));
  useEscape(Boolean(current), close);

  return (
    <AnimatePresence>
      {current && <Bloom key={`${current.name}-${current.level}`} pillar={current} onClose={close} />}
    </AnimatePresence>
  );
}

const PETALS = 12;
// Scale and turn about the flower's centre, in the SVG's own coordinates.
const AROUND_HEART = { transformBox: "view-box", transformOrigin: "110px 110px" };

function Bloom({ pillar, onClose }) {
  const still = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1];
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-[rgba(11,11,31,0.72)] backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: still ? 0.2 : 0.35 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${pillar.name} reached level ${pillar.level}`}
    >
      <div className="flex flex-col items-center text-center max-w-[320px]">
        <svg viewBox="0 0 220 220" className="w-[220px] h-[220px] overflow-visible" aria-hidden="true">
          {/* A soft glow behind the bloom */}
          <motion.circle cx="110" cy="110" r="96" fill={pillar.color} fillOpacity="0.18"
            initial={still ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease }} style={AROUND_HEART} />
          {/* Petals opening one after another */}
          {Array.from({ length: PETALS }, (_, i) => {
            const angle = (360 / PETALS) * i;
            // Each petal sits at its angle around the heart; it grows out
            // from the heart (scaling about the centre of the flower).
            return (
              <g key={i} transform={`rotate(${angle} 110 110)`}>
                <motion.g style={AROUND_HEART}
                  initial={still ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: still ? 0 : 0.12 + i * 0.045, duration: 0.7, ease }}>
                  <path d="M110,110 Q132,72 110,18 Q88,72 110,110 Z" fill={pillar.color} fillOpacity={i % 2 ? 0.78 : 0.95}
                    stroke="#FBF3DF" strokeOpacity="0.35" strokeWidth="0.8" />
                </motion.g>
              </g>
            );
          })}
          <motion.g initial={still ? false : { scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: still ? 0 : 0.5, duration: 0.6, ease }} style={AROUND_HEART}>
            <SunflowerHeart filled={100} cx={110} cy={110} r={34} />
          </motion.g>
          {/* Golden seeds drifting out, once */}
          {!still && Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2 + 0.2;
            const dist = 92 + (i % 3) * 16;
            return (
              <motion.circle key={`s${i}`} cx="110" cy="110" r={i % 4 === 0 ? 2.6 : 1.8} fill={i % 3 ? "#E0B865" : "#F3DE9C"}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: Math.cos(a) * dist, y: Math.sin(a) * dist, opacity: [0, 1, 0] }}
                transition={{ delay: 0.75 + (i % 5) * 0.06, duration: 1.6, ease: "easeOut" }} />
            );
          })}
        </svg>

        <motion.div initial={still ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: still ? 0 : 0.85, duration: 0.6, ease }}>
          <div className="text-label uppercase tracking-[0.16em] text-[#E0B865] mt-3">Level {pillar.level}</div>
          <div className="font-serif text-[30px] leading-tight text-[#FBF3DF] mt-1">Your {pillar.name} has grown</div>
          <p className="text-bodySm text-[#CBC8E2] mt-2 mb-5">Every small step you took counted. It shows.</p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 rounded-full bg-[#E0B865] text-[#19193D] font-medium text-body"
          >
            Thank you
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
