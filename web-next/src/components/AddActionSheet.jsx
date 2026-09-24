import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, Target, Image, BookOpen, Lightbulb, Sparkles, ArrowLeft } from "lucide-react";
import { fadeIn, sheetIn } from "./ui/motion";
import { Button } from "./ui/Button";
import { useAppData } from "../lib/AppDataContext";

// Journal/Idea/Experience all save straight to the journal — they're the
// same underlying action (a free-form entry), just auto-tagged so an idea
// or an experience is easy to find again later without a heavier flow.
const QUICK_JOURNAL = {
  journal: { title: "Journal", placeholder: "What's on your mind today?", tag: null },
  idea: { title: "Idea", placeholder: "What's the idea?", tag: "idea" },
  experience: { title: "Experience", placeholder: "What happened?", tag: "experience" }
};

const OPTIONS = [
  { key: "dream", icon: Star, title: "Dream", desc: "What kind of life do you want?" },
  { key: "memory", icon: Image, title: "Memory", desc: "An experience worth remembering" },
  { key: "journal", icon: BookOpen, title: "Journal", desc: "Whatever's on your mind" },
  { key: "goal", icon: Target, title: "Goal", desc: "Something you're actively working toward" },
  { key: "idea", icon: Lightbulb, title: "Idea", desc: "A spark worth capturing" },
  { key: "experience", icon: Sparkles, title: "Experience", desc: "Something that happened" }
];

export default function AddActionSheet({ open, onClose, onSelectPursue, onSelectMoment }) {
  const { addJournalEntry } = useAppData();
  const [screen, setScreen] = useState("choices");
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);
  const [journalSaving, setJournalSaving] = useState(false);
  const [journalError, setJournalError] = useState("");

  function handleClose() {
    onClose();
    setTimeout(() => {
      setScreen("choices");
      setJournalText("");
      setJournalSaved(false);
      setJournalError("");
    }, 250);
  }

  async function saveJournalEntry() {
    setJournalSaving(true);
    setJournalError("");
    try {
      const tag = QUICK_JOURNAL[screen]?.tag;
      await addJournalEntry({ content: journalText.trim(), tags: tag ? [tag] : [] });
      setJournalSaved(true);
    } catch (e) {
      console.error("[AddActionSheet] journal save failed:", e);
      setJournalError("Couldn't save that — check your connection and try again.");
    }
    setJournalSaving(false);
  }

  function handleSelect(key) {
    if (key === "dream" || key === "goal") {
      onClose();
      onSelectPursue(key);
      return;
    }
    if (key === "memory") {
      onClose();
      onSelectMoment();
      return;
    }
    setScreen(key);
  }

  const quickConfig = QUICK_JOURNAL[screen];

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
                <div className="font-serif text-h2 mb-4">Add to your YOUniverse</div>
                <div className="space-y-2.5">
                  {OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => handleSelect(opt.key)}
                      className="w-full text-left bg-surface1 rounded-card p-3.5 flex items-center gap-3.5 hover:bg-surface3 transition-colors duration-150"
                    >
                      <div className="w-10 h-10 rounded-full bg-forestAccent text-surface2 flex items-center justify-center flex-none">
                        <opt.icon size={18} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-h3 font-medium text-forest">{opt.title}</div>
                        <div className="text-bodySm text-textSecondary">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {quickConfig && (
              <>
                <BackButton onClick={() => setScreen("choices")} />
                <div className="font-serif text-h2 mb-3">{quickConfig.title}</div>
                {journalSaved ? (
                  <div className="text-bodySm text-textSecondary mb-4">
                    Saved to your Reflections journal.
                  </div>
                ) : (
                  <>
                    <textarea
                      autoFocus
                      rows={4}
                      value={journalText}
                      onChange={e => setJournalText(e.target.value)}
                      placeholder={quickConfig.placeholder}
                      className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field mb-3"
                    />
                    {journalError && <div className="text-bodySm text-red-500 mb-3">{journalError}</div>}
                    <Button
                      variant="primary"
                      className="w-full"
                      disabled={!journalText.trim() || journalSaving}
                      onClick={saveJournalEntry}
                    >
                      {journalSaving ? "Saving…" : "Save"}
                    </Button>
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

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-bodySm text-textSecondary mb-3">
      <ArrowLeft size={16} strokeWidth={1.75} />
      Back
    </button>
  );
}
