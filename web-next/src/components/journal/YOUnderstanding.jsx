import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, PenLine, Search } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { pickNoticedPatterns, pickReflectionQuestion } from "../../lib/compass";
import { easeOut } from "../ui/motion";

// YOUnderstanding: what YOU has noticed across recent entries, and a
// question to sit with. It lives at the very top of YOUrnal as a pill
// (Cassidy, Nov 1), folded until tapped, since it grows out of the writing.
// Reads insights already made when entries were reflected on; never calls AI.
export default function YOUnderstanding({ onWrite }) {
  const { recentInsights, loadRecentInsights, loaded } = useAppData();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    if (!loaded || asked) return;
    setAsked(true);
    loadRecentInsights().catch(e => console.error("[YOUnderstanding] load failed:", e));
  }, [loaded, asked, loadRecentInsights]);

  const pattern = pickNoticedPatterns(recentInsights, 1)[0] || null;
  const question = pickReflectionQuestion(recentInsights);
  if (!pattern && !question) return null;
  const from = pattern?.entryDate
    ? new Date(pattern.entryDate + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long" })
    : null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="younderstanding"
        className={`inline-flex items-center gap-2 min-h-[36px] pl-2 pr-3 rounded-full border transition ${
          open ? "bg-surface1 border-forestAccent" : "bg-surface1 border-borderC hover:border-forestAccent"
        }`}
      >
        <span className="w-6 h-6 rounded-full bg-[color-mix(in_srgb,var(--forest-accent)_14%,transparent)] text-forestAccent flex items-center justify-center">
          <Search size={13} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="text-label uppercase text-forestAccent">YOUnderstanding</span>
        <ChevronDown size={14} strokeWidth={1.75} className={`text-textMuted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.section
            id="younderstanding"
            aria-label="YOUnderstanding"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-card bg-surface1 border-l-2 border-forestAccent shadow-card p-4">
              <div className="text-caption text-textMuted mb-1.5">What YOU has noticed{from ? `, from your entry on ${from}` : ""}</div>
              {pattern && <p className="font-serif text-body text-textPrimary italic m-0 mb-2.5">{pattern.text}</p>}
              {question && <p className="text-bodySm text-textSecondary m-0">{question}</p>}
              {question && onWrite && (
                <button
                  type="button"
                  onClick={onWrite}
                  className="mt-3 inline-flex items-center gap-1.5 min-h-[36px] text-bodySm text-forestAccent font-medium"
                >
                  <PenLine size={15} strokeWidth={1.75} /> Write about it
                </button>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
