import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
import { useEscape } from "../ui/useEscape";
import { easeOut } from "../ui/motion";
import { STEP_COMPONENTS, stepReady, stepAnswered } from "./Steps";

const DRAFT = key => `you-course-draft:${key}`;

function readDraft(key) {
  if (!key) return null;
  try { return JSON.parse(localStorage.getItem(DRAFT(key)) || "null"); } catch { return null; }
}
export function clearDraft(key) {
  try { localStorage.removeItem(DRAFT(key)); } catch { /* ignore */ }
}

// Plays a list of steps full-screen, one at a time. Whatever's written is
// kept on this device as a draft until the part is finished, so closing
// halfway loses nothing.
//   onFinish(data) — async; throw to stay on the last step with an error
//   onCarry()      — a challenge's "carry it with me"
export default function StepRunner({ steps, eyebrow, title, draftKey, onFinish, onClose, onCarry, finishLabel = "Finish" }) {
  const reduce = useReducedMotion();
  const draft = readDraft(draftKey);
  const [index, setIndex] = useState(() => Math.min(draft?.index || 0, steps.length - 1));
  const [data, setData] = useState(() => draft?.data || {});
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!draftKey) return;
    try { localStorage.setItem(DRAFT(draftKey), JSON.stringify({ index, data })); } catch { /* ignore */ }
  }, [draftKey, index, data]);

  useEscape(true, onClose);

  // Each step starts at its top.
  const scroller = useRef(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [index]);

  const step = steps[index];
  const Comp = STEP_COMPONENTS[step.type];
  const value = step.key ? data[step.key] : undefined;
  // Accepts a value or an updater (so quick taps never overwrite each other).
  const set = v => setData(d => ({ ...d, [step.key]: typeof v === "function" ? v(d[step.key]) : v }));
  const last = index === steps.length - 1;
  const ready = stepReady(step, value);
  const optionalEmpty = ["reflect", "choose", "list", "value"].includes(step.type) && !stepAnswered(step, value);

  async function next() {
    setError("");
    if (!last) {
      setDir(1);
      setIndex(i => i + 1);
      return;
    }
    setSaving(true);
    try {
      await onFinish(data);
      clearDraft(draftKey);
    } catch (e) {
      console.error("[StepRunner] finish failed:", e);
      setError("Couldn't save just now. Check your connection and try again. Your words are kept on this device.");
    }
    setSaving(false);
  }

  function back() {
    setError("");
    setDir(-1);
    setIndex(i => Math.max(0, i - 1));
  }

  // Each step slides in from the side it comes from. Entrance only: waiting
  // on an exit could leave a quick tap showing the previous step.
  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, x: 28 * dir }, animate: { opacity: 1, x: 0 } };

  return (
    <div className="fixed inset-0 z-40 bg-bg flex flex-col font-sans">
      {/* Top: where you are, how far, and a way out that keeps your words. */}
      <div className="flex-none px-5 pt-[max(14px,env(safe-area-inset-top))] pb-3">
        <div className="max-w-[560px] mx-auto">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              {eyebrow && <div className="text-label uppercase text-gold truncate">{eyebrow}</div>}
              {title && <div className="text-bodySm text-textSecondary truncate">{title}</div>}
            </div>
            <button onClick={onClose} className="flex items-center gap-1 text-bodySm text-textSecondary hover:text-textPrimary flex-none py-1">
              <X size={16} strokeWidth={1.75} /> Save &amp; close
            </button>
          </div>
          <div className="flex gap-1" aria-label={`Step ${index + 1} of ${steps.length}`} role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1}>
            {steps.map((_, i) => (
              <span key={i} className="flex-1 h-1 rounded-full bg-surface3 overflow-hidden">
                <motion.span
                  className="block h-full bg-gold"
                  initial={false}
                  animate={{ width: i <= index ? "100%" : "0%" }}
                  transition={{ duration: reduce ? 0 : 0.4, ease: easeOut }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The step. */}
      <div ref={scroller} className="flex-1 overflow-y-auto px-5">
        <div className="max-w-[560px] mx-auto py-6">
          <motion.div key={index} {...slide} transition={{ duration: reduce ? 0.15 : 0.32, ease: easeOut }}>
            <Comp
              step={step}
              value={value}
              onChange={set}
              onLived={() => { setDir(1); setIndex(i => i + 1); }}
              onCarry={onCarry || onClose}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom: back and on. A challenge brings its own buttons. */}
      {step.type !== "challenge" && (
        <div className="flex-none border-t border-borderC bg-bg px-5 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
          <div className="max-w-[560px] mx-auto">
            {error && <div role="alert" className="text-bodySm text-red-500 mb-2">{error}</div>}
            <div className="flex gap-2.5">
              {index > 0 ? (
                <button onClick={back} disabled={saving} className="flex-1 min-h-[50px] rounded-sm border border-borderC bg-surface1 text-textPrimary text-body flex items-center justify-center gap-1.5 hover:bg-surface3 disabled:opacity-40">
                  <ArrowLeft size={17} strokeWidth={1.75} /> Back
                </button>
              ) : <div className="flex-1" />}
              <button
                onClick={next}
                disabled={!ready || saving}
                className="flex-[1.4] min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : last ? finishLabel : optionalEmpty ? "Skip" : "Next"}
              </button>
            </div>
            {!ready && <div className="text-caption text-textMuted text-center mt-2">{step.type === "scale" ? "Answer each one to continue." : "Choose one to continue."}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
