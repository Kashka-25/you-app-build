import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Bookmark, RefreshCw, Trash2 } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { describeSources } from "../../lib/aiSources";
import { easeOut } from "../ui/motion";

// A season reading, full screen (Cassidy, Nov 2): "the read comes up as a
// screen read experience and then when it's crossed out of, it's asked to
// be saved or changed or deleted, and then if saved, it goes into the
// memories ordered by its date".
//
// The reading is saved the moment it's made (infer-season writes it), so
// Keep simply closes; Change and Delete remove it. `fresh` asks on close;
// opened again from the timeline, closing just closes and Delete is offered
// at the foot.

function niceDate(key) {
  return new Date(key + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function label(reading) {
  const kind = reading.based_on?.kind;
  if (kind === "equinox" || kind === "season") return reading.based_on?.title || "Season review";
  if (kind === "lookback") return "Look back";
  return "Your season";
}

// "4 harvests, 12 entries and 2 moments"
function counted(based) {
  const n = (k, one, many) => (based[k] ? `${based[k]} ${based[k] === 1 ? one : many}` : null);
  const parts = [n("harvests", "harvest", "harvests"), n("entries", "entry", "entries"), n("moments", "moment", "moments")].filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

const PARTS = [
  ["grew", "What grew"],
  ["light", "Light"],
  ["shadow", "Shadow"],
  ["balance", "Keep in balance"],
  ["carry", "Carry forward"]
];

export default function SeasonReading({ reading, fresh = false, onClose, onChange }) {
  const { deleteSeason } = useAppData();
  const reduce = useReducedMotion();
  const [asking, setAsking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const based = reading?.based_on || {};
  const parts = PARTS.filter(([k]) => based.review?.[k]);
  const from = counted(based);

  function close() {
    if (fresh) setAsking(true);
    else onClose();
  }

  useEffect(() => {
    if (!reading) return;
    const onKey = e => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [reading, fresh]);

  async function remove(then) {
    setBusy(true);
    setError("");
    try {
      await deleteSeason(reading.id);
      setAsking(false);
      setConfirmDelete(false);
      then();
    } catch (e) {
      console.error("[SeasonReading] delete failed:", e);
      setError("Couldn't remove it just now. Check your connection and try again.");
    }
    setBusy(false);
  }

  const rise = (i) => reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { ease: easeOut, duration: 0.7, delay: 0.25 + i * 0.18 } };

  return createPortal(
    <AnimatePresence>
      {reading && (
        <motion.div
          key="season-reading"
          role="dialog"
          aria-modal="true"
          aria-label={reading.name}
          className="fixed inset-0 z-[60] overflow-y-auto text-[var(--ai-text)]"
          style={{ background: "radial-gradient(120% 70% at 80% 0%, rgba(201,162,77,0.22) 0%, transparent 55%), linear-gradient(180deg, var(--ai-ink-2), var(--ai-ink))" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.4 }}
        >
          <div className="max-w-[560px] mx-auto px-6 pb-16" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={close}
                aria-label="Close the reading"
                className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-full text-[var(--ai-text-2)] hover:bg-white/10"
              >
                <X size={22} strokeWidth={1.75} />
              </button>
            </div>

            <motion.div {...rise(0)} className="text-label uppercase tracking-[0.2em] text-[#E8C877] mt-6">
              {label(reading)}
              {based.from && <span className="text-[var(--ai-text-3)]"> · {niceDate(based.from)} – {niceDate(based.to || based.from)}</span>}
            </motion.div>
            <motion.h1 {...rise(1)} className="font-serif text-[38px] leading-[1.1] ai-gold-text m-0 mt-3">{reading.name}</motion.h1>
            {reading.blurb && (
              <motion.p {...rise(2)} className="font-serif text-[20px] leading-relaxed text-[var(--ai-text)] m-0 mt-5">{reading.blurb}</motion.p>
            )}
            {(reading.signals || []).length > 0 && (
              <motion.div {...rise(3)} className="flex flex-wrap gap-1.5 mt-5">
                {reading.signals.map(sig => (
                  <span key={sig} className="text-caption bg-white/10 text-[var(--ai-text-2)] px-2.5 py-1 rounded-full">{sig}</span>
                ))}
              </motion.div>
            )}
            {parts.map(([k, name], i) => (
              <motion.div key={k} {...rise(4 + i)} className="mt-6">
                <div className="text-label uppercase text-[#E8C877]">{name}</div>
                <p className="text-body text-[var(--ai-text-2)] m-0 mt-1">{based.review[k]}</p>
              </motion.div>
            ))}

            {/* Always say what it read (Cassidy, Oct 27). */}
            <motion.div {...rise(5 + parts.length)} className="mt-8 pt-4 border-t border-white/10 text-caption text-[var(--ai-text-3)]">
              Read from {from || "your recent weeks"}
              {Array.isArray(based.sources) && based.sources.length > 0 && <>, drawing on {describeSources(based.sources)}</>}.
              {!fresh && (
                <>
                  {" · "}
                  <button type="button" onClick={() => setConfirmDelete(true)} className="underline underline-offset-2">Delete this reading</button>
                </>
              )}
            </motion.div>
            {!fresh && confirmDelete && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-bodySm">
                <span className="text-[var(--ai-text-2)]">Delete it for good?</span>
                <button type="button" disabled={busy} onClick={() => remove(onClose)} className="min-h-[36px] px-3 rounded-full bg-white/15 text-[var(--ai-text)]">
                  {busy ? "Deleting…" : "Delete"}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-[36px] px-3 rounded-full text-[var(--ai-text-2)]">Keep it</button>
              </div>
            )}
            {!asking && error && <div className="text-caption text-[#F2B8A0] mt-2">{error}</div>}
          </div>

          {/* Closing a fresh reading: keep, change or delete. */}
          <AnimatePresence>
            {asking && (
              <motion.div
                key="ask"
                className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !busy && setAsking(false)}
              >
                <motion.div
                  role="alertdialog"
                  aria-labelledby="season-ask-title"
                  onClick={e => e.stopPropagation()}
                  className="ai-card rounded-t-card sm:rounded-card w-full max-w-[440px] p-5"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
                  initial={reduce ? false : { y: 40 }}
                  animate={{ y: 0 }}
                  exit={reduce ? undefined : { y: 40 }}
                  transition={{ ease: easeOut, duration: 0.35 }}
                >
                  <h2 id="season-ask-title" className="font-serif text-h2 ai-gold-text m-0">Keep this reading?</h2>
                  <p className="text-bodySm text-[var(--ai-text-2)] m-0 mt-1">Kept readings sit in your Memories, by the date they end.</p>
                  <div className="flex flex-col gap-2 mt-4">
                    <button type="button" disabled={busy} onClick={() => { setAsking(false); onClose(); }} className="flex items-center gap-3 min-h-[48px] px-4 rounded-sm bg-[var(--ai-gold-2)] text-[var(--ai-ink)] font-medium">
                      <Bookmark size={18} strokeWidth={1.75} /> Keep it in Memories
                    </button>
                    <button type="button" disabled={busy} onClick={() => remove(onChange)} className="flex items-center gap-3 min-h-[48px] px-4 rounded-sm bg-white/10 text-[var(--ai-text)]">
                      <RefreshCw size={18} strokeWidth={1.75} /> Change the time and read again
                    </button>
                    <button type="button" disabled={busy} onClick={() => remove(onClose)} className="flex items-center gap-3 min-h-[48px] px-4 rounded-sm text-[var(--ai-text-2)] hover:bg-white/10">
                      <Trash2 size={18} strokeWidth={1.75} /> {busy ? "Removing…" : "Delete it"}
                    </button>
                  </div>
                  {error && <div className="text-caption text-[#F2B8A0] mt-2">{error}</div>}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
