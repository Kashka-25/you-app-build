import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Lightbulb, LifeBuoy, X } from "lucide-react";
import { fadeIn, sheetIn } from "./ui/motion";
import { Button } from "./ui/Button";
import { useEscape } from "./ui/useEscape";
import { supabase } from "../lib/supabaseClient";

// Beta feedback from any tester. Lands in Cassidy's Build Notes inbox in
// Notion (supabase/functions/send-feedback), with the screen it came from.
const KINDS = [
  { key: "problem", icon: LifeBuoy, label: "Something's not right" },
  { key: "idea", icon: Lightbulb, label: "An idea" },
  { key: "love", icon: Heart, label: "Something I love" }
];

const PROMPTS = {
  problem: "What happened, and what did you expect instead?",
  idea: "What would make YOU better for you?",
  love: "What's working for you?"
};

export default function FeedbackSheet({ open, onClose }) {
  const { pathname } = useLocation();
  const [kind, setKind] = useState("problem");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function close() {
    onClose();
    // Clear after the sheet has slid away.
    setTimeout(() => { setSent(false); setText(""); setError(""); }, 300);
  }
  useEscape(open, close);

  async function send() {
    setSending(true);
    setError("");
    const { error: err } = await supabase.functions.invoke("send-feedback", {
      body: { text: text.trim(), kind, screen: pathname }
    });
    setSending(false);
    if (err) {
      let message = "Couldn't send that just now. Try again in a moment.";
      try { message = (await err.context.json()).error || message; } catch { /* keep the default */ }
      setError(message);
      return;
    }
    setSent(true);
    setText("");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div {...fadeIn} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={close}>
          <motion.div
            {...sheetIn}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[420px] bg-surface2 rounded-t-card sm:rounded-card p-5 pb-6"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <div id="feedback-title" className="font-serif text-h2">Send feedback</div>
              <button onClick={close} aria-label="Close" className="text-textMuted hover:text-textPrimary mt-1">
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {sent ? (
              <div className="py-4">
                <div className="font-serif italic text-body text-textPrimary mb-4">
                  Thank you. It's on its way to Cassidy, and helps shape what YOU becomes.
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setSent(false)}>Send another</Button>
                  <Button size="sm" className="flex-1" onClick={close}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-bodySm text-textSecondary mb-4">You're helping build YOU. Every note is read.</div>
                <div className="grid grid-cols-3 gap-2 mb-3" role="radiogroup" aria-label="Kind of feedback">
                  {KINDS.map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={kind === key}
                      onClick={() => setKind(key)}
                      className={`flex flex-col items-center gap-1.5 rounded-sm border px-2 py-2.5 text-caption leading-tight text-center ${kind === key ? "border-forestAccent bg-surface1 text-textPrimary" : "border-borderC text-textSecondary"}`}
                    >
                      <Icon size={18} strokeWidth={1.75} className={kind === key ? "text-forestAccent" : "text-textMuted"} />
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={5}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  maxLength={5000}
                  placeholder={PROMPTS[kind]}
                  aria-label={PROMPTS[kind]}
                  className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field mb-2"
                />
                <div className="text-caption text-textMuted mb-3">The screen you're on is included, so we can find it. Please leave out anything private.</div>
                {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
                <Button className="w-full" disabled={!text.trim() || sending} onClick={send}>
                  {sending ? "Sending…" : "Send"}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
