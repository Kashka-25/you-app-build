import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, Sparkles, BookOpen, ArrowLeft } from "lucide-react";
import { fadeIn, sheetIn } from "./ui/motion";
import { Button } from "./ui/Button";

const OPTIONS = [
  { key: "todo", icon: CheckSquare, title: "Today's list", desc: "A quick one-off task for today only" },
  { key: "pursue", icon: Sparkles, title: "Habit, goal, or dream", desc: "The full Pursue flow — tags, milestones, intention" },
  { key: "journal", icon: BookOpen, title: "Journal entry", desc: "A reflection, straight to today's log" }
];

export default function AddActionSheet({ open, onClose, onSelectPursue }) {
  const [screen, setScreen] = useState("choices");
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);

  function handleClose() {
    onClose();
    setTimeout(() => {
      setScreen("choices");
      setJournalText("");
      setJournalSaved(false);
    }, 250);
  }

  function handleSelect(key) {
    if (key === "pursue") {
      onClose();
      onSelectPursue();
      return;
    }
    setScreen(key);
  }

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

            {screen === "todo" && (
              <>
                <BackButton onClick={() => setScreen("choices")} />
                <div className="font-serif text-h2 mb-2">Today's list</div>
                <div className="text-bodySm text-textSecondary mb-4">
                  This needs a quick data-shape decision before it can actually save anywhere:
                  does a one-off task reuse the <code className="text-caption bg-surface1 px-1 py-0.5 rounded">items</code> table
                  with a new <code className="text-caption bg-surface1 px-1 py-0.5 rounded">type: "todo"</code>, or does it need
                  its own shape? That's a data-layer call, not a UI one — flagged, not built yet.
                </div>
                <Button variant="secondary" className="w-full" onClick={handleClose}>Got it</Button>
              </>
            )}

            {screen === "journal" && (
              <>
                <BackButton onClick={() => setScreen("choices")} />
                <div className="font-serif text-h2 mb-3">Journal entry</div>
                {journalSaved ? (
                  <div className="text-bodySm text-textSecondary mb-4">
                    Noted — the Reflections screen is still a placeholder, so this isn't saved
                    anywhere real yet. It'll land here once Reflections is wired up.
                  </div>
                ) : (
                  <>
                    <textarea
                      autoFocus
                      rows={4}
                      value={journalText}
                      onChange={e => setJournalText(e.target.value)}
                      placeholder="What's on your mind today?"
                      className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent mb-3"
                    />
                    <Button
                      variant="primary"
                      className="w-full"
                      disabled={!journalText.trim()}
                      onClick={() => setJournalSaved(true)}
                    >
                      Save
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
