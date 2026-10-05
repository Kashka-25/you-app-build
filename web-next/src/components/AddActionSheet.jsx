import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sprout, Sun, BookOpen, Repeat, Target, Star, Image, ArrowLeft, ChevronRight, X } from "lucide-react";
import { fadeIn, sheetIn } from "./ui/motion";
import { Button } from "./ui/Button";
import { useEscape } from "./ui/useEscape";
import { useAppData } from "../lib/AppDataContext";

// Three choices at the top level, never more (standing rule: max 2–3 at
// one level). Anything finer — which kind of pursuit, which kind of
// journal note — lives one tap deeper, behind the choice it belongs to.
const TOP = [
  { key: "pursuit", icon: Sprout, title: "Pursuit", desc: "A habit, goal, or dream" },
  { key: "today", icon: Sun, title: "Today", desc: "A small thing for today" },
  { key: "journal", icon: BookOpen, title: "Journal", desc: "Whatever's on your mind" }
];

const PURSUITS = [
  { key: "habit", icon: Repeat, title: "Habit", desc: "Something you return to" },
  { key: "goal", icon: Target, title: "Goal", desc: "Something you're actively working toward" },
  { key: "dream", icon: Star, title: "Dream", desc: "What kind of life do you want?" }
];

// Idea/Experience are still journal entries, just auto-tagged so they're
// easy to find again later.
const JOURNAL_KINDS = [
  { key: "entry", label: "Entry", placeholder: "What's on your mind today?", tag: null },
  { key: "idea", label: "Idea", placeholder: "What's the idea?", tag: "idea" },
  { key: "experience", label: "Experience", placeholder: "What happened?", tag: "experience" }
];

const fieldClass =
  "w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field mb-3";

export default function AddActionSheet({ open, onClose, onSelectPursue, onSelectMoment }) {
  const { addJournalEntry, addTodo } = useAppData();
  const [screen, setScreen] = useState("choices");
  const [text, setText] = useState("");
  const [kind, setKind] = useState("entry");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setScreen("choices");
    setText("");
    setKind("entry");
    setSaved(false);
    setError("");
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 250);
  }

  function goTo(next) {
    setText("");
    setSaved(false);
    setError("");
    setScreen(next);
  }

  function pickPursuit(type) {
    onClose();
    onSelectPursue(type);
    setTimeout(reset, 250);
  }

  function pickMoment() {
    onClose();
    onSelectMoment();
    setTimeout(reset, 250);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      if (screen === "today") {
        await addTodo(text.trim());
        // Stay open so a few things can be jotted in a row.
        setText("");
        setSaved(true);
      } else {
        const tag = JOURNAL_KINDS.find(k => k.key === kind)?.tag;
        await addJournalEntry({ content: text.trim(), tags: tag ? [tag] : [] });
        setSaved(true);
      }
    } catch (e) {
      console.error("[AddActionSheet] save failed:", e);
      setError("Couldn't save that — check your connection and try again.");
    }
    setSaving(false);
  }

  const journalKind = JOURNAL_KINDS.find(k => k.key === kind);
  useEscape(open, handleClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div {...fadeIn} className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center" onClick={handleClose}>
          <motion.div
            {...sheetIn}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[390px] bg-surface2 rounded-t-card p-5 pb-6"
          >
            {screen === "choices" && (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="font-serif text-h2">Add to your YOUniverse</div>
                  <button onClick={handleClose} aria-label="Close" className="text-textMuted hover:text-textPrimary mt-1">
                    <X size={20} strokeWidth={1.75} />
                  </button>
                </div>
                <ChoiceList options={TOP} onPick={goTo} />
              </>
            )}

            {screen === "pursuit" && (
              <>
                <BackButton onClick={() => goTo("choices")} />
                <div className="font-serif text-h2 mb-4">Plant a pursuit</div>
                <ChoiceList options={PURSUITS} onPick={pickPursuit} />
              </>
            )}

            {screen === "today" && (
              <>
                <BackButton onClick={() => goTo("choices")} />
                <div className="font-serif text-h2 mb-1">Today</div>
                <div className="text-bodySm text-textSecondary mb-3">
                  Just for today. Whatever's left tonight simply falls away.
                </div>
                <input
                  autoFocus
                  value={text}
                  onChange={e => { setText(e.target.value); setSaved(false); }}
                  onKeyDown={e => { if (e.key === "Enter" && text.trim() && !saving) save(); }}
                  placeholder="Call Mum, post the letter…"
                  className={fieldClass}
                />
                {saved && <div className="text-bodySm text-textSecondary mb-3">Added to today. Add another, or close when you're done.</div>}
                {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
                <div className="flex gap-2.5">
                  <Button variant="secondary" className="flex-1" onClick={handleClose}>Done</Button>
                  <Button variant="primary" className="flex-1" disabled={!text.trim() || saving} onClick={save}>
                    {saving ? "Adding…" : "Add"}
                  </Button>
                </div>
              </>
            )}

            {screen === "journal" && (
              <>
                <BackButton onClick={() => goTo("choices")} />
                <div className="font-serif text-h2 mb-3">Journal</div>
                {saved ? (
                  <>
                    <div className="text-bodySm text-textSecondary mb-4">Saved to your Reflections journal.</div>
                    <Button variant="secondary" className="w-full" onClick={handleClose}>Close</Button>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3" role="radiogroup" aria-label="Kind of entry">
                      {JOURNAL_KINDS.map(k => (
                        <button
                          key={k.key}
                          role="radio"
                          aria-checked={kind === k.key}
                          onClick={() => setKind(k.key)}
                          className={`px-3 py-1.5 rounded-full text-bodySm border ${
                            kind === k.key
                              ? "bg-forestAccent text-surface2 border-forestAccent"
                              : "bg-surface1 text-textSecondary border-borderC"
                          }`}
                        >
                          {k.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      autoFocus
                      rows={4}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={journalKind.placeholder}
                      className={fieldClass}
                    />
                    {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
                    <Button variant="primary" className="w-full" disabled={!text.trim() || saving} onClick={save}>
                      {saving ? "Saving…" : "Save"}
                    </Button>
                    <button
                      onClick={pickMoment}
                      className="w-full flex items-center justify-center gap-1.5 text-bodySm text-textSecondary mt-3"
                    >
                      <Image size={15} strokeWidth={1.75} />
                      Add a memory with a photo instead
                    </button>
                  </>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChoiceList({ options, onPick }) {
  return (
    <div className="space-y-2.5">
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onPick(opt.key)}
          className="w-full text-left bg-surface1 rounded-card p-3.5 flex items-center gap-3.5 hover:bg-surface3 transition-colors duration-150"
        >
          <div className="w-10 h-10 rounded-full bg-forestAccent text-surface2 flex items-center justify-center flex-none">
            <opt.icon size={18} strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-h3 font-medium text-forest">{opt.title}</div>
            <div className="text-bodySm text-textSecondary">{opt.desc}</div>
          </div>
          <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted flex-none" />
        </button>
      ))}
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-bodySm text-textSecondary mb-3">
      <ArrowLeft size={16} strokeWidth={1.75} />
      Back
    </button>
  );
}
