import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { latestNew, useMarkWhatsNewSeen, useWhatsNewUnseen } from "../lib/whatsNew";
import { useEscape } from "./ui/useEscape";
import { easeOut } from "./ui/motion";

// "New in YOU" in the top bar, beside the profile circle (Cassidy, Nov 1):
// always there, glowing gold while something's unseen. On a phone it's the
// sparkle alone; with room, it's named. It drops down the latest update to
// read on the spot, with a way to it and a way to everything else new.
// Opening it counts as having seen it.
export default function NewInYou() {
  const latest = latestNew();
  const unseen = useWhatsNewUnseen();
  const markSeen = useMarkWhatsNewSeen();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(64);
  const box = useRef(null);
  const panel = useRef(null);
  useEscape(open, () => setOpen(false));

  // A tap anywhere else folds it away.
  useEffect(() => {
    if (!open) return;
    const away = e => {
      if (!box.current?.contains(e.target) && !panel.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  if (!latest) return null;
  const toggle = () => {
    if (!open) {
      markSeen();
      // Hangs just under the bar, against the screen's right edge.
      setTop(Math.round(box.current.getBoundingClientRect().bottom + 12));
    }
    setOpen(o => !o);
  };
  const date = new Date(latest.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long" });

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="new-in-you"
        aria-label={unseen ? "New in YOU: something you haven't seen" : "New in YOU"}
        className={`relative inline-flex items-center justify-center gap-1.5 h-8 min-w-8 sm:pl-2.5 sm:pr-3 rounded-full text-caption font-medium border transition ${
          unseen
            ? "bg-[color-mix(in_srgb,var(--gold)_22%,var(--surface-2))] border-gold text-textPrimary shadow-[0_0_12px_color-mix(in_srgb,var(--gold)_50%,transparent)]"
            : "bg-surface1 border-borderC text-textSecondary hover:text-textPrimary"
        }`}
      >
        <Sparkles size={15} strokeWidth={1.75} className="text-gold" aria-hidden="true" />
        <span className="hidden sm:inline">New in YOU</span>
        {unseen && <span className="absolute -top-0.5 -right-0.5 w-[9px] h-[9px] rounded-full bg-gold border-2 border-surface2" aria-hidden="true" />}
      </button>

      {/* On the page itself, not inside the bar: the bar's frosted glass
          would otherwise keep it underneath the page below. */}
      {createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            id="new-in-you"
            role="region"
            aria-label="The latest in YOU"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: easeOut }}
            style={{ top }}
            className="fixed right-4 z-50 w-[min(320px,calc(100vw-2rem))] rounded-card bg-surface2 shadow-card border border-borderC p-4 text-left"
          >
            <div className="text-label uppercase text-textMuted">New in YOU · {date}</div>
            <div className="font-serif text-h3 text-textPrimary leading-snug mt-0.5">{latest.title}</div>
            <p className="text-bodySm text-textSecondary m-0 mt-1.5 max-h-[40vh] overflow-y-auto">{latest.body}</p>
            {latest.to && (
              <Link
                to={latest.to}
                onClick={() => setOpen(false)}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 min-h-[40px] rounded-full bg-forestAccent text-onAccent text-bodySm font-medium hover:bg-forest"
              >
                {latest.open || "Take me there"} <ArrowRight size={15} strokeWidth={2} />
              </Link>
            )}
            <Link
              to="/whats-new"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 min-h-[36px] text-caption text-forestAccent font-medium"
            >
              See everything new <ArrowRight size={13} strokeWidth={1.75} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}
