import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { bandFor, scoreOf } from "../../lib/mood";
import { easeOut } from "../ui/motion";
import { localDateKey } from "../../lib/week";
import { LeafSprig } from "./Botanical";
import MoodFace from "./MoodFace";

const SKIPPED = "you.checkin.skipped";

function skippedToday() {
  try { return sessionStorage.getItem(SKIPPED) === localDateKey(); } catch { return false; }
}

// "How are you arriving today?" as a 0–100 scale with a face that follows
// it (Cassidy, Oct 27). Optional, never a gate. Once answered, the card
// steps aside and the face sits in the welcome banner (MoodBadge; Oct 28):
// tap it to say how you are now, and each change is its own mood_log entry.
export default function DailyCheckIn() {
  const { moodLog, logMood } = useAppData();
  const today = localDateKey();
  const latest = moodLog.find(m => m.date_key === today) || null;
  const latestScore = scoreOf(latest);
  const [skipped, setSkipped] = useState(skippedToday);

  if (latestScore == null) {
    if (skipped) return null;
    return (
      <section aria-labelledby="home-checkin" className="relative overflow-hidden rounded-card bg-surface1 shadow-card p-4">
        <LeafSprig className="pointer-events-none absolute -left-3 -bottom-4 w-12 text-sage opacity-30" />
        <LeafSprig flip className="pointer-events-none absolute -right-2 -top-6 w-10 text-sage opacity-25" />
        <div className="relative flex items-baseline justify-between gap-3">
          <h2 id="home-checkin" className="font-serif text-h3 text-textPrimary m-0">How are you arriving today?</h2>
          <button
            type="button"
            onClick={() => { try { sessionStorage.setItem(SKIPPED, today); } catch { /* this visit only */ } setSkipped(true); }}
            className="flex-none whitespace-nowrap text-caption text-textMuted underline underline-offset-2 min-h-[32px]"
          >
            Skip for now
          </button>
        </div>
        <p className="relative text-bodySm text-textSecondary m-0 mt-1 mb-2">Slide to where you are. Any answer is welcome.</p>
        <MoodScale start={50} onSave={logMood} saveLabel="Check in" />
      </section>
    );
  }

  return null;
}

// Today's face and word, in the welcome banner. Tap to say how you are now.
// `fallback` is a mood given with today's journal entry, shown as before
// when there's no check-in yet.
export function MoodBadge({ ink = "text-textPrimary", fallback = null }) {
  const { moodLog, logMood } = useAppData();
  const today = localDateKey();
  const latest = moodLog.find(m => m.date_key === today) || null;
  const score = scoreOf(latest);
  const [open, setOpen] = useState(false);
  if (score == null) {
    if (!fallback) return null;
    return (
      <div className="inline-flex self-start items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-white/70 border border-borderC dark:bg-black/30 dark:border-white/10">
        <fallback.Icon size={14} strokeWidth={1.75} className={ink} />
        <span className={`text-bodySm font-medium ${ink}`}>Arriving {fallback.label.toLowerCase()} today</span>
      </div>
    );
  }
  const band = bandFor(score);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Today you're arriving ${band.label.toLowerCase()}, ${score} out of 100. Tap to say how you are now.`}
        className="inline-flex self-start items-center gap-2 mt-3 pl-1 pr-3 py-1 rounded-full bg-white/70 border border-borderC dark:bg-black/30 dark:border-white/10 active:scale-[0.98] transition"
      >
        <MoodFace score={score} size={30} />
        <span className={`text-bodySm font-medium ${ink}`}>Arriving {band.label.toLowerCase()} today</span>
      </button>
      <AnimatePresence>
        {open && (
          <UpdateSheet score={score} onClose={() => setOpen(false)} onSave={async s => { await logMood(s); setOpen(false); }} />
        )}
      </AnimatePresence>
    </>
  );
}

// The slider, the face and the word, with a save button.
function MoodScale({ start, onSave, saveLabel }) {
  const [score, setScore] = useState(start);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const band = bandFor(score);

  async function save() {
    setSaving(true);
    setError("");
    try { await onSave(score); } catch (e) {
      console.error("[DailyCheckIn] save failed:", e);
      setError("Couldn't save that just now. Try again in a moment.");
    }
    setSaving(false);
  }

  return (
    <div className="relative">
      <div className="flex flex-col items-center">
        <MoodFace score={score} size={104} />
        <div className="mt-1 text-body text-textPrimary font-medium">{band.label}</div>
        <div className="text-caption text-textMuted">{score} out of 100</div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={score}
        onChange={e => setScore(Number(e.target.value))}
        aria-label="How you're arriving, from 0 to 100"
        aria-valuetext={`${band.label}, ${score} out of 100`}
        className="mood-range w-full mt-3"
      />
      <div className="flex justify-between text-[10px] uppercase tracking-wide text-textMuted mt-0.5" aria-hidden="true">
        <span>Low</span><span>Steady</span><span>Energised</span>
      </div>
      {error && <div className="text-caption text-red-500 mt-2">{error}</div>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-3 w-full min-h-[44px] rounded-full bg-forestAccent text-onAccent font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}

function UpdateSheet({ score, onClose, onSave }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="How are you now?"
        initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
        transition={{ duration: 0.25, ease: easeOut }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:w-[380px] bg-surface2 rounded-t-card sm:rounded-card shadow-card p-5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-serif text-h3 text-textPrimary">How are you now?</div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-textMuted hover:text-textPrimary">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <MoodScale start={score} onSave={onSave} saveLabel="Save how I am now" />
        <Link to="/reflections" onClick={onClose} className="block text-center mt-2 text-caption text-forestAccent min-h-[32px]">Write about it in your YOUrnal</Link>
      </motion.div>
    </motion.div>
  );
}
