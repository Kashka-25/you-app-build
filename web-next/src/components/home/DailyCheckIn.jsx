import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MOODS } from "../ui/Input";
import { easeOut } from "../ui/motion";
import { localDateKey } from "../../lib/week";
import { LeafSprig } from "./Botanical";

// Soft tints per state: warm to cool, none of them "bad".
const TINT = { rough: "#C8665A", low: "#D08A4E", okay: "#C9A23C", good: "#6F9A5E", great: "#6F8A3E" };
const SKIPPED = "you.checkin.skipped";

function skippedToday() {
  try { return sessionStorage.getItem(SKIPPED) === localDateKey(); } catch { return false; }
}

// "How are you arriving today?" Optional, one tap, never a gate. Saved to
// mood_log; once answered it folds down to a single line that can be
// changed. If saving fails, it says so instead of pretending.
export default function DailyCheckIn({ todayMood, onPick }) {
  const [skipped, setSkipped] = useState(skippedToday);
  const [choosing, setChoosing] = useState(false);
  const [pending, setPending] = useState(null);
  const [unsaved, setUnsaved] = useState(null);
  const current = unsaved || todayMood || null;

  if (skipped && !current) return null;

  async function pick(key) {
    setPending(key);
    setUnsaved(null);
    try {
      await onPick(key);
    } catch (e) {
      console.error("[DailyCheckIn] save failed:", e);
      setUnsaved(key);
    }
    setPending(null);
    setChoosing(false);
  }

  function skip() {
    try { sessionStorage.setItem(SKIPPED, localDateKey()); } catch { /* this visit only */ }
    setSkipped(true);
  }

  const mood = MOODS.find(m => m.key === current);
  const open = !mood || choosing;

  return (
    <section aria-labelledby="home-checkin" className="relative overflow-hidden rounded-card bg-surface1 shadow-card p-4">
      <LeafSprig className="pointer-events-none absolute -left-3 -bottom-4 w-12 text-sage opacity-30" />
      <LeafSprig flip className="pointer-events-none absolute -right-2 -top-6 w-10 text-sage opacity-25" />
      <div className="relative flex items-baseline justify-between gap-3">
        <h2 id="home-checkin" className="font-serif text-h3 text-textPrimary m-0">
          {open ? "How are you arriving today?" : "Arriving today"}
        </h2>
        {open && !mood && (
          <button type="button" onClick={skip} className="flex-none whitespace-nowrap text-caption text-textMuted underline underline-offset-2 min-h-[32px]">
            Skip for now
          </button>
        )}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="choose"
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: easeOut }}
          >
            <p className="text-bodySm text-textSecondary m-0 mt-1 mb-3">A moment to check in with yourself. Any answer is welcome.</p>
            <div className="grid grid-cols-5 gap-1" role="group" aria-label="How you're arriving">
              {MOODS.map(({ key, Icon, label }) => {
                const on = current === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pick(key)}
                    disabled={pending !== null}
                    aria-pressed={on}
                    className="flex flex-col items-center gap-1.5 py-1.5 min-h-[76px] rounded-sm active:scale-95 transition disabled:opacity-60"
                  >
                    <span
                      className="w-11 h-11 rounded-full flex items-center justify-center transition-shadow"
                      style={{
                        background: `color-mix(in srgb, ${TINT[key]} ${on || pending === key ? 38 : 20}%, transparent)`,
                        color: TINT[key],
                        boxShadow: on ? `0 0 0 2px ${TINT[key]}` : "none"
                      }}
                    >
                      <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className={`text-caption ${on ? "text-textPrimary font-semibold" : "text-textSecondary"}`}>{label}</span>
                  </button>
                );
              })}
            </div>
            {mood && (
              <button type="button" onClick={() => setChoosing(false)} className="mt-2 text-caption text-textMuted underline underline-offset-2 min-h-[32px]">
                Keep {mood.label.toLowerCase()}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chosen"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="flex items-center gap-3 mt-2"
          >
            <span
              className="w-10 h-10 flex-none rounded-full flex items-center justify-center"
              style={{ background: `color-mix(in srgb, ${TINT[mood.key]} 30%, transparent)`, color: TINT[mood.key] }}
            >
              <mood.Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-body text-textPrimary">{mood.label}</div>
              <Link to="/reflections" className="text-caption text-forestAccent">Write about it in your Journal</Link>
            </div>
            <button type="button" onClick={() => setChoosing(true)} className="text-caption text-textSecondary underline underline-offset-2 min-h-[44px] px-1">
              Change
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {unsaved && (
        <p role="status" className="text-caption text-textMuted m-0 mt-2">
          Couldn't save that just now, so it's only noted on this screen. Try again later.
        </p>
      )}
    </section>
  );
}
