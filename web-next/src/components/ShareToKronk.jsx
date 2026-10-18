import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Send, X } from "lucide-react";
import { fadeIn, sheetIn } from "./ui/motion";
import { Button } from "./ui/Button";
import { useEscape } from "./ui/useEscape";
import { postToKronk, useKronkLink } from "../lib/kronk";

// "Share with your mates on Kronk": a quiet offer at a meaningful moment
// (a Harvest, a value ripening, a highlight, a Showcase piece). Shown only
// to Seekers who've connected Kronk. Never automatic: the words are
// pre-filled but editable, the Seeker chooses who sees it, and nothing goes
// until they press Share.
const AUDIENCE = [
  { value: "private", label: "My mates", desc: "Only people who follow you" },
  { value: "unlisted", label: "Quietly", desc: "Anyone with the link; not in Kronk's feeds" },
  { value: "public", label: "Everyone", desc: "All of Kronk" }
];

export default function ShareToKronk({ text, label = "Share with your mates on Kronk", className = "" }) {
  const link = useKronkLink();
  const [open, setOpen] = useState(false);
  if (!link) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 text-bodySm text-textSecondary min-h-[44px] ${className}`}
      >
        <span className="w-6 h-6 rounded-full bg-[#2B1F3D] text-[#E8DDF5] text-[12px] leading-6 text-center font-semibold flex-none" aria-hidden="true">Ж</span>
        <span className="underline underline-offset-4 decoration-borderC">{label}</span>
      </button>
      <ShareSheet open={open} onClose={() => setOpen(false)} initialText={text} handle={link.handle} />
    </>
  );
}

function ShareSheet({ open, onClose, initialText, handle }) {
  const [text, setText] = useState(initialText || "");
  const [audience, setAudience] = useState("private");
  const [sending, setSending] = useState(false);
  const [sentUrl, setSentUrl] = useState(undefined);
  const [error, setError] = useState("");

  function close() {
    onClose();
    setTimeout(() => { setSentUrl(undefined); setError(""); setText(initialText || ""); }, 300);
  }
  useEscape(open, close);

  async function share() {
    setSending(true);
    setError("");
    try {
      const { url } = await postToKronk(text.trim(), audience);
      setSentUrl(url || null);
    } catch (e) {
      setError(e.message);
    }
    setSending(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div {...fadeIn} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={close}>
          <motion.div
            {...sheetIn}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-kronk-title"
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[420px] bg-surface2 rounded-t-card sm:rounded-card p-5 pb-6"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <div id="share-kronk-title" className="font-serif text-h2">Share on Kronk</div>
              <button onClick={close} aria-label="Close" className="text-textMuted hover:text-textPrimary mt-1">
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {sentUrl !== undefined ? (
              <div className="py-3">
                <p className="font-serif italic text-body text-textPrimary mb-4">Shared. Your mates will see it on Kronk.</p>
                <div className="flex gap-2">
                  {sentUrl && (
                    <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-h-[40px] rounded-sm border border-borderC text-bodySm text-textPrimary inline-flex items-center justify-center gap-1.5">
                      See it on Kronk <ExternalLink size={13} strokeWidth={1.75} />
                    </a>
                  )}
                  <Button size="sm" className="flex-1" onClick={close}>Done</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-caption text-textMuted mb-3">As {handle}. Change the words however you like.</div>
                <textarea
                  rows={5}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  maxLength={5000}
                  aria-label="What to share"
                  className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field mb-3"
                />
                <div className="text-label uppercase text-textMuted mb-1.5">Who sees it</div>
                <div className="space-y-1.5 mb-4" role="radiogroup" aria-label="Who sees it">
                  {AUDIENCE.map(a => (
                    <button
                      key={a.value}
                      type="button"
                      role="radio"
                      aria-checked={audience === a.value}
                      onClick={() => setAudience(a.value)}
                      className={`w-full flex items-center gap-3 rounded-sm border px-3 py-2 text-left ${audience === a.value ? "border-forestAccent bg-surface1" : "border-borderC"}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex-none ${audience === a.value ? "border-forestAccent bg-forestAccent" : "border-borderC"}`} aria-hidden="true" />
                      <span>
                        <span className="block text-bodySm text-textPrimary">{a.label}</span>
                        <span className="block text-caption text-textMuted">{a.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
                <Button className="w-full" icon={Send} disabled={!text.trim() || sending} onClick={share}>
                  {sending ? "Sharing…" : "Share"}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
