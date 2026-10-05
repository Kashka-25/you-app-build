import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, LifeBuoy, Sprout, Archive, Wind } from "lucide-react";
import { useEscape } from "../ui/useEscape";
import { useAppData } from "../../lib/AppDataContext";
import { fadeIn, sheetIn } from "../ui/motion";
import { Button } from "../ui/Button";
import AddItemModal from "../pursue/AddItemModal";
import {
  LIGHT_SHADOW_STEPS, DREAM_STAGES, DREAM_QUESTIONS, DREAM_OUTCOMES, SUPPORT_LINK, fill
} from "../../constants/questionnaires";

const OUTCOME_ICONS = { planted: Sprout, held: Archive, released: Wind };

const OUTCOME_LINES = {
  planted: "Planted. It lives in Pursue now, among your dreams.",
  held: "Held as a seed. It will be here whenever you're ready.",
  released: "Released, with thanks. It has done its work."
};

// Build the step list for one questionnaire. Freeing the Dream ends in an
// outcome choice; Light & Shadow ends after Integration.
function buildSteps(questionnaire, valueName, pillar) {
  if (questionnaire === "light_shadow") {
    return LIGHT_SHADOW_STEPS.map(s => ({ ...s, question: fill(s.question, { value: valueName }) }));
  }
  const bank = DREAM_QUESTIONS[pillar] || {};
  return DREAM_STAGES.map(s => ({ ...s, question: bank[s.kind] || "" }));
}

const FINAL_KIND = { light_shadow: "integration", freeing_dream: "outcome" };

// One question per screen. Every answer is saved when the Seeker moves on
// (or closes), so they can stop anywhere and pick up where they left off.
// Nothing here is sent to an AI.
export default function QuestionnaireFlow({ open, onClose, questionnaire, valueName, pillar, sessionId: resumeId }) {
  const { reflections, saveReflectionAnswer } = useAppData();
  const steps = useMemo(() => buildSteps(questionnaire, valueName, pillar), [questionnaire, valueName, pillar]);

  const [sessionId, setSessionId] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [resumed, setResumed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [planting, setPlanting] = useState(false);

  // On open: resume the latest unfinished sitting for this value/Pillar (or
  // the one asked for), otherwise start a new one.
  useEffect(() => {
    if (!open) return;
    const mine = reflections.filter(r =>
      r.questionnaire === questionnaire &&
      (questionnaire === "light_shadow" ? r.value_name === valueName : r.pillar === pillar)
    );
    const sessions = [...new Set(mine.map(r => r.session_id))];
    const unfinished = resumeId
      ? resumeId
      : sessions.reverse().find(id => !mine.some(r => r.session_id === id && r.kind === FINAL_KIND[questionnaire]));
    if (unfinished) {
      const rows = mine.filter(r => r.session_id === unfinished);
      const a = Object.fromEntries(rows.map(r => [r.kind, r.body]));
      setSessionId(unfinished);
      setAnswers(a);
      const firstOpen = steps.findIndex(s => !a[s.kind]);
      setStep(firstOpen === -1 ? steps.length : firstOpen);
      setResumed(rows.length > 0);
      setOutcome(a.outcome || null);
    } else {
      setSessionId(crypto.randomUUID());
      setAnswers({});
      setStep(0);
      setResumed(false);
      setOutcome(null);
    }
    setError("");
    // Only when opening — not on every reflections change while it's open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = steps[step];
  const text = current ? answers[current.kind] || "" : "";
  const atEnd = step >= steps.length;

  async function saveCurrent() {
    if (!current || !text.trim()) return;
    await saveReflectionAnswer({
      sessionId, questionnaire, kind: current.kind, body: text.trim(), prompt: current.question, valueName, pillar
    });
  }

  async function go(delta) {
    setSaving(true);
    setError("");
    try {
      await saveCurrent();
      setStep(s => Math.max(0, s + delta));
    } catch (e) {
      console.error("[QuestionnaireFlow] save failed:", e);
      setError("Couldn't save that — check your connection and try again.");
    }
    setSaving(false);
  }

  useEscape(open, () => close());
  async function close() {
    try {
      await saveCurrent();
    } catch (e) {
      console.error("[QuestionnaireFlow] save on close failed:", e);
    }
    onClose();
  }

  async function chooseOutcome(key) {
    setSaving(true);
    setError("");
    try {
      await saveReflectionAnswer({ sessionId, questionnaire, kind: "outcome", body: key, prompt: null, valueName, pillar });
      setOutcome(key);
      if (key === "planted") setPlanting(true);
    } catch (e) {
      console.error("[QuestionnaireFlow] outcome save failed:", e);
      setError("Couldn't save that — check your connection and try again.");
    }
    setSaving(false);
  }

  const plantPrefill = useMemo(() => ({
    name: "",
    cat: pillar,
    note: [answers.vision, answers.seed && `First seed: ${answers.seed}`].filter(Boolean).join("\n\n")
  }), [pillar, answers.vision, answers.seed]);

  const title = questionnaire === "light_shadow" ? `Light & Shadow of ${valueName}` : `Freeing the Dream · ${pillar}`;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div {...fadeIn} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={close}>
            <motion.div
              {...sheetIn}
              onClick={e => e.stopPropagation()}
              className="w-full sm:w-[440px] max-h-[90vh] overflow-y-auto bg-surface2 rounded-t-card sm:rounded-card shadow-card p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="font-serif text-h2 text-textPrimary">{title}</div>
                  {!atEnd && (
                    <div className="text-caption text-textMuted mt-0.5">
                      {step + 1} of {steps.length} · {current.title}
                    </div>
                  )}
                </div>
                <button onClick={close} className="flex items-center gap-1 text-bodySm text-textSecondary flex-none mt-1">
                  <X size={16} strokeWidth={1.75} />
                  Save &amp; close
                </button>
              </div>

              {!atEnd && (
                <>
                  {resumed && step > 0 && (
                    <div className="text-caption text-textMuted mb-3">Picking up where you left off.</div>
                  )}
                  <div className="font-serif text-h3 text-textPrimary mb-1.5">{current.question}</div>
                  {current.hint && <div className="text-bodySm text-textMuted mb-3">{current.hint}</div>}
                  <textarea
                    autoFocus
                    rows={5}
                    value={text}
                    onChange={e => setAnswers(a => ({ ...a, [current.kind]: e.target.value }))}
                    className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field mb-3"
                  />
                  {current.support && <SupportLine />}
                  {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
                  <div className="flex gap-2.5">
                    {step > 0 ? (
                      <Button variant="secondary" className="flex-1" icon={ArrowLeft} disabled={saving} onClick={() => go(-1)}>
                        Back
                      </Button>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <Button variant="primary" className="flex-1" disabled={saving} onClick={() => go(1)}>
                      {saving ? "Saving…" : text.trim() ? (step === steps.length - 1 ? "Finish" : "Next") : "Skip for now"}
                    </Button>
                  </div>
                </>
              )}

              {atEnd && questionnaire === "light_shadow" && (
                <div>
                  <div className="font-serif italic text-body text-textPrimary mb-4">
                    Thank you for sitting with {valueName}, light and shadow both.
                  </div>
                  <AnswerSummary steps={steps} answers={answers} />
                  <div className="text-caption text-textMuted mb-4">Kept in Reflections → Explorations, just for you.</div>
                  <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
                </div>
              )}

              {atEnd && questionnaire === "freeing_dream" && (
                <div>
                  {outcome ? (
                    <>
                      <div className="font-serif italic text-body text-textPrimary mb-4">{OUTCOME_LINES[outcome]}</div>
                      <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
                    </>
                  ) : (
                    <>
                      <div className="font-serif text-h3 text-textPrimary mb-3">What would you like to do with this dream?</div>
                      <div className="space-y-2.5">
                        {DREAM_OUTCOMES.map(o => {
                          const Icon = OUTCOME_ICONS[o.key];
                          return (
                            <button
                              key={o.key}
                              disabled={saving}
                              onClick={() => chooseOutcome(o.key)}
                              className="w-full text-left bg-surface1 rounded-card p-3.5 flex items-center gap-3.5 hover:bg-surface3 transition-colors duration-150"
                            >
                              <div className="w-10 h-10 rounded-full bg-forestAccent text-surface2 flex items-center justify-center flex-none">
                                <Icon size={18} strokeWidth={1.75} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-h3 font-medium text-forest">{o.title}</div>
                                <div className="text-bodySm text-textSecondary">{o.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {error && <div className="text-bodySm text-red-500 mt-3">{error}</div>}
                      <button
                        onClick={() => setStep(steps.length - 1)}
                        className="flex items-center gap-1.5 text-bodySm text-textSecondary mt-3"
                      >
                        <ArrowLeft size={15} strokeWidth={1.75} />
                        Back
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddItemModal open={planting} onClose={() => setPlanting(false)} defaultType="dream" prefill={plantPrefill} />
    </>
  );
}

export function AnswerSummary({ steps, answers }) {
  return (
    <div className="space-y-3 mb-4">
      {steps.filter(s => answers[s.kind]).map(s => (
        <div key={s.kind}>
          <div className="text-label uppercase text-textMuted mb-0.5">{s.title}</div>
          <div className="text-bodySm text-textPrimary whitespace-pre-wrap">{answers[s.kind]}</div>
        </div>
      ))}
    </div>
  );
}

function SupportLine() {
  return (
    <div className="text-caption text-textMuted mb-3 flex items-start gap-1.5">
      <LifeBuoy size={13} strokeWidth={1.75} className="flex-none mt-0.5" />
      <span>
        {SUPPORT_LINK.label}{" "}
        <a href={SUPPORT_LINK.url} target="_blank" rel="noreferrer" className="underline text-textSecondary">
          {SUPPORT_LINK.cta}
        </a>
      </span>
    </div>
  );
}
